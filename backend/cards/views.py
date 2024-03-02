from rest_framework import viewsets, permissions
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    CardSeriesSerializer,
    TagSerializer,
    CardSerializer,
    CardPartialSerializer
)
from .models import CardSeries, Tag, Card, CardPartial


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

        queryset = CardSeries.objects.all()
        if card:
            card = Card.objects.get(pk=card_id)
            queryset = queryset.filter(pk=card.card_series.id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class TagsViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.order_by('pk')
    lookup_field = 'pk'
    
class CardsViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly
    ]
    lookup_field = 'pk'

    def get_queryset(self):
        series = self.request.query_params.get('series', None)
        tags = self.request.query_params.get('tags', None)
        tag_inclusion = self.request.query_params.get('tag_inclusion', None)
        fulltext = self.request.query_params.get('fulltext', None)

        queryset = Card.objects.all()
        if series:
            queryset = queryset.filter(
                card_series=series
            )
        if tags:
            queryset = queryset.filter(
                tags__in=tags.split(',')
            )
            
        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class CardPartialsViewSet(viewsets.ModelViewSet):
    serializer_class = CardPartialSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        card = self.request.query_params.get('card', None)

        queryset = CardPartial.objects.all()
        if card:
            queryset = queryset.filter(
                card=card
            )
            
        return queryset.order_by('position')