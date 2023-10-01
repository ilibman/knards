from rest_framework import viewsets
from .serializers import (
    CardSeriesSerializer,
    TagSerializer,
    CardSerializer,
    CardPartialSerializer
)
from .models import CardSeries, Tag, Card, CardPartial


class CardSeriesViewSet(viewsets.ModelViewSet):
    serializer_class = CardSeriesSerializer
    queryset = CardSeries.objects.order_by('pk')
    lookup_field = 'pk'

class TagsViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.order_by('pk')
    lookup_field = 'pk'
    
class CardsViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
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

class CardPartialsViewSet(viewsets.ModelViewSet):
    serializer_class = CardPartialSerializer
    queryset = CardPartial.objects.order_by('position')
    lookup_field = 'pk'