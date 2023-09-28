from rest_framework import serializers
from .models import CardSeries, Tag, Card, CardPartial

class CardSeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardSeries
        fields = '__all__'
        lookup_field = 'id'

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'
        lookup_field = 'id'

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'
        lookup_field = 'id'

class CardPartialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardPartial
        fields = '__all__'
        lookup_field = 'id'