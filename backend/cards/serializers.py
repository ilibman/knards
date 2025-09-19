from rest_framework import serializers
from .models import CardSeries, Tag, Card, CardPartial, CardScore

class CardSeriesSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

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
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Card
        fields = '__all__'
        lookup_field = 'id'

class CardPartialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardPartial
        fields = '__all__'
        lookup_field = 'id'

class CardScoreSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    
    class Meta:
        model = CardScore
        fields = '__all__'
        lookup_field = 'id'