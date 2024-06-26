# Generated by Django 5.0.6 on 2024-05-26 19:21

from django.db import migrations
from cards.models import Card

def reset_n_in_series(apps, schema_editor):
    cards = Card.objects.filter(card_series=None)
    for card in cards:
        card.n_in_series = 1
        card.save()


class Migration(migrations.Migration):

    dependencies = [
        ('cards', '0009_remove_card_score_cardscore'),
    ]

    operations = [
        migrations.RunPython(reset_n_in_series)
    ]
