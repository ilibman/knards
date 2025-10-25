import datetime, pytz, math, random
from collections import defaultdict, Counter
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
    lookup_field = 'pk'

    def get_queryset(self):
        card = self.request.query_params.get('card', None)

        queryset = CardSeries.objects.filter(owner=self.request.user)
        if card:
            card = Card.objects.get(pk=card_id)
            queryset = queryset.filter(pk=card.card_series.id)
            
        return queryset.order_by('name')

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
        series_total_cards_count = {}
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
            }
            if card.card_series:
                series_name = card.card_series.name
                if series_name in series_total_cards_count:
                    series_total_cards_count[series_name] += 1
                else:
                    series_total_cards_count[series_name] = 1
            
            card_score = 0
            try:
                card_score_obj = CardScore.objects.get(
                    card=card.id,
                    owner=request.user
                )
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

            eligible_for_revision = card_score < days_passed and days_passed > 0

            if eligible_for_revision:
                modified_card['weight'] = int(
                    1000 * math.exp(-0.6 * card_score)
                        + 18 * math.pow(days_passed, 0.7)
                )
                modified_cardset.append(modified_card)

            if card.tags_set_str not in cards_total_by_tags:
                cards_total_by_tags[card.tags_set_str] = {}
                cards_total_by_tags[card.tags_set_str]['total'] = 1
                cards_total_by_tags[card.tags_set_str]['to_revise'] = (
                    1 if eligible_for_revision else 0
                )
            else:
                cards_total_by_tags[card.tags_set_str]['total'] += 1
                cards_total_by_tags[card.tags_set_str]['to_revise'] += (
                    1 if eligible_for_revision else 0
                )
        
        global_tag_strs = {}
        
        # count how many times each tag appears throughout the key-value pairs
        tag_counts = Counter(
            tag.strip()
            for key in cards_total_by_tags
            for tag in key.split(',')
        )

        for key, values in cards_total_by_tags.items():
            tags = [t.strip() for t in key.split(',')]
            for tag in tags:
                # only aggregate tags that appear in multiple keys
                if tag_counts[tag] > 1:
                    if tag not in global_tag_strs:
                        global_tag_strs[tag] = {'total': 0, 'to_revise': 0}
                    global_tag_strs[tag]['total'] += values.get('total', 0)
                    global_tag_strs[tag]['to_revise'] \
                        += values.get('to_revise', 0)
        
        cards_total_by_tags.update(global_tag_strs)
        cards_total_by_tags \
            = {k: cards_total_by_tags[k] for k in sorted(cards_total_by_tags)}

        for card in modified_cardset:
            if card['series_id']:
                card['total_cards_in_series']\
                    = series_total_cards_count[card['series_name']]

        return Response({
            'cardset': cardset_randomize_and_group_by_weights_and_series(
                modified_cardset
            ),
            'cards_total': cardset.count(),
            'cards_total_by_tags': cards_total_by_tags
        })

    @action(detail=False, methods=['GET'])
    def get_cards_from_series(self, request):
        cardset = get_cardset_by_query_params(
            request.query_params,
            request.user
        )

        serializer = CardSerializer(cardset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'])
    def reorder_cards_in_series(self, request):
        cards_from_db = list()

        for index, card in enumerate(
            sorted(request.data['cards_from_series'],
            key=lambda x: int(x['n_in_series']))
        ):
            card_from_db = Card.objects.get(pk=int(card['id']))
            card_from_db.n_in_series = -(index + 1)
            card_from_db.save()
            cards_from_db.append(card_from_db)

        for card in cards_from_db:
            card.n_in_series = -(card.n_in_series)
            card.save()

        return Response({
            'result': 'ok'
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

def cardset_randomize_and_group_by_weights_and_series(cardset):
    # group by weight
    weight_groups = defaultdict(list)
    for card in cardset:
        weight_groups[card['weight']].append(card)

    # sort weights descending
    sorted_weights = sorted(weight_groups.keys(), reverse=True)

    # index by series_id for quick access
    series_map = defaultdict(list)
    for card in cardset:
        if card['series_id'] is not None:
            series_map[card['series_id']].append(card)

    parsed_series = set()
    result = []

    for weight in sorted_weights:
        wgroup = weight_groups[weight]
        random.shuffle(wgroup)

        i = 0
        while i < len(wgroup):
            card = wgroup[i]
            if card['series_id'] is not None:
                series_id = card['series_id']
                if series_id not in parsed_series:
                    # insert full series group here
                    full_group = series_map[series_id]
                    result.extend(full_group)
                    parsed_series.add(series_id)

                    # remove series from current and future groups
                    for w in sorted_weights:
                        weight_groups[w] = [
                            o for o in weight_groups[w] \
                                if o['series_id'] != series_id
                        ]
                    # restart loop with current weight group (it has changed)
                    wgroup = weight_groups[weight]
                    random.shuffle(wgroup)
                    i = 0
                    continue
            else:
                result.append(card)
            i += 1

    return result