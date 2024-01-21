from rest_framework import serializers
from djoser.serializers import UserSerializer
from django.contrib.auth import get_user_model
from cards.models import CardSeries, Card


class UserSerializer(UserSerializer):
    card_series = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=CardSeries.objects.all()
    )
    cards = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Card.objects.all()
    )

    class Meta(UserSerializer.Meta):
        model = get_user_model()
        fields = ['id', 'username', 'email', 'password', 'card_series', 'cards']