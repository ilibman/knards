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
    queryset = CardSeries.objects.order_by('-pk')
    lookup_field = 'pk'

class TagsViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.order_by('-pk')
    lookup_field = 'pk'
    
class CardsViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    queryset = Card.objects.order_by('-created_at')
    lookup_field = 'pk'

class CardPartialsViewSet(viewsets.ModelViewSet):
    serializer_class = CardPartialSerializer
    queryset = CardPartial.objects.order_by('-position')
    lookup_field = 'pk'