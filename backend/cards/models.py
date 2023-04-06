from django.db import models


class CardSeries(models.Model):
    name = models.CharField(max_length=100)
    
    
class Tag(models.Model):
    name = models.CharField(max_length=50)


class Card(models.Model):
    card_series = models.ForeignKey(
        CardSeries,
        on_delete=models.CASCADE,
        related_name='cards'
    )
    n_in_series = models.PositiveIntegerField()
    title = models.CharField(max_length=50)
    tags = models.ManyToManyField(Tag)
    score = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # custom logic handlers

        super(Card, self).save(*args, **kwargs)
    
    def __str__(self):
        return self.title


class CardPartialType(models.TextChoices):
    TEXT = 'text'
    CODE = 'code'


class CardPartial(models.Model):
    card = models.ForeignKey(
        Card,
        on_delete=models.CASCADE,
        related_name='card_partials'
    )
    partial_type = models.CharField(
        max_length=20,
        choices=CardPartialType.choices,
        default=CardPartialType.TEXT
    )
    content = models.TextField()
    position = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['position']