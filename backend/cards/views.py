import datetime, pytz, math
from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from knards.pagination import TanstackPagination
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    CardSeriesSerializer,
    TagSerializer,
    CardSerializer,
    CardPartialSerializer,
    CardScoreSerializer
)
from .models import CardSeries, Tag, Card, CardPartial, CardScore


class CardSeriesViewSet(viewsets.ModelViewSet):
    serializer_class = CardSeriesSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly
    ]
    queryset = CardSeries.objects.order_by('pk')
    lookup_field = 'pk'

    def get_queryset(self):
        card = self.request.query_params.get('card', None)

        queryset = CardSeries.objects.filter(owner=self.request.user)
        if card:
            card = Card.objects.get(pk=card_id)
            queryset = queryset.filter(pk=card.card_series.id)
            
        return queryset

    def perform_create(self, serializer):
        # clean up unused series
        card_series = CardSeries.objects.filter(owner=self.request.user)
        for series in card_series:
            cards = Card.objects.filter(card_series=series.id)
            if len(cards) == 0:
                series.delete()

        serializer.save(owner=self.request.user)

class TagsViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.order_by('name')
    lookup_field = 'pk'
    
class CardsViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly
    ]
    pagination_class = TanstackPagination
    lookup_field = 'pk'

    def get_queryset(self):
        cardset = get_cardset_by_query_params(
            self.request.query_params,
            self.request.user
        )
        return cardset.order_by('-created_at')

    def perform_create(self, serializer):
        card_series = self.request.data.get('card_series', None)
        cards = Card.objects.filter(
            card_series=card_series
        )
        n_in_series = 1 if card_series is None else len(cards) + 1

        serializer.save(owner=self.request.user, n_in_series=n_in_series)

    @action(detail=False, methods=['GET'])
    def get_cardset_and_statistics_by_query_params(self, request):
        cardset = get_cardset_by_query_params(
            request.query_params,
            request.user
        )

        modified_cardset = []
        cards_total_by_tags = {}
        for card in cardset:
            modified_card = {
                'id': card.pk,
                'title': card.title,
                'series_id': card.card_series.pk if card.card_series else None,
                'series_name': card.card_series.name if card.card_series else None,
                'n_in_series': card.n_in_series,
                'tags_ids': [tag.id for tag in card.tags.all()],
                'tags_names': [tag.name for tag in card.tags.all()],
                'created_at': int(card.created_at.timestamp() * 1000),
                'owner_id': card.owner.id,
                'owner_name': card.owner.username,
                'revised': False,
            }
            
            card_score = 0
            try:
                card_score_obj = CardScore.objects.get(card=card.id, owner=request.user)
                last_revision_date = card_score_obj.last_revised_at
                card_score = card_score_obj.score

                modified_card['score_id'] = card_score_obj.pk
                modified_card['score'] = card_score
            except CardScore.DoesNotExist:
                last_revision_date = card.created_at

                modified_card['score_id'] = None
                modified_card['score'] = 0
            days_passed = (
                datetime.datetime.now(tz=pytz.UTC) - last_revision_date
            ).days
            
            modified_card['weight'] = int(
                1000 * math.exp(-0.6 * card_score)
                    + 18 * math.pow(days_passed, 0.7)
            )
            modified_cardset.append(modified_card)

            if card.tags_set_str not in cards_total_by_tags:
                cards_total_by_tags[card.tags_set_str] = {}
                cards_total_by_tags[card.tags_set_str]['total'] = 1
                cards_total_by_tags[card.tags_set_str]['to_revise'] = (
                    1 if card_score <= days_passed or days_passed == 0 else 0
                )
            else:
                cards_total_by_tags[card.tags_set_str]['total'] += 1
                cards_total_by_tags[card.tags_set_str]['to_revise'] += (
                    1 if card_score <= days_passed or days_passed == 0 else 0
                )

        return Response({
            'cardset': modified_cardset,
            'cards_total': cardset.count(),
            'cards_total_by_tags': cards_total_by_tags
        })

class CardPartialsViewSet(viewsets.ModelViewSet):
    serializer_class = CardPartialSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        card = self.request.query_params.get('card', None)

        if card:
            queryset = CardPartial.objects.filter(card=card)
        else:
            queryset = CardPartial.objects.all()
            cards = Card.objects.filter(owner=self.request.user)
            q = Q()
            for _ in cards:
                q |= Q(card=_)
            queryset = queryset.filter(q)
            
        return queryset.order_by('position')

class CardScoresViewSet(viewsets.ModelViewSet):
    serializer_class = CardScoreSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        card = self.request.query_params.get('card', None)
        if not card:
            queryset = CardScore.objects.filter(
                owner=self.request.user
            )
        else:
            queryset = CardScore.objects.filter(
                card=card,
                owner=self.request.user
            )
            
        return queryset.order_by('pk')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

def get_cardset_by_query_params(query_params, owner):
    series = query_params.get('series', None)
    tags = query_params.get('tags', None)
    tag_inclusion = query_params.get('tag_inclusion', 'or')
    fulltext = query_params.get('fulltext', None)

    cardset = Card.objects.filter(owner=owner)
    if series:
        cardset = cardset.filter(
            card_series=series
        )
    if tags:
        tags_list = tags.split(',')
        if tag_inclusion == 'or':
            q = Q()
            for tag in tags_list:
                q |= Q(tags=tag)
            cardset = cardset.filter(q)
        if tag_inclusion == 'and':
            for index, tag in enumerate(tags_list):
                if index == 0:
                    cardset = cardset.filter(tags=tag)
                else:
                    cardset &= cardset.filter(tags=tag)
    
    return cardset.distinct()