from django.db import models
from django.contrib.auth import get_user_model


class CardSeries(models.Model):
    name = models.CharField(
        max_length=100,
        blank=False,
        null=False
    )
    owner = models.ForeignKey(
        get_user_model(),
        blank=True,
        null=True,
        related_name='card_series',
        on_delete=models.CASCADE
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'card series'
    
    
class Tag(models.Model):
    name = models.CharField(
        max_length=50,
        blank=False,
        null=False
    )

    def __str__(self):
        return self.name


class Card(models.Model):
    card_series = models.ForeignKey(
        CardSeries,
        on_delete=models.CASCADE,
        related_name='cards',
        blank=True,
        null=True
    )
    n_in_series = models.PositiveIntegerField(
        default=1,
        blank=False,
        null=False
    )
    title = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )
    tags = models.ManyToManyField(Tag, blank=True)
    score = models.PositiveSmallIntegerField(
        default=0,
        blank=False,
        null=False
    )
    owner = models.ForeignKey(
        get_user_model(),
        blank=True,
        null=True,
        related_name='cards',
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # custom logic handlers

        super(Card, self).save(*args, **kwargs)
    
    def __str__(self):
        return (
            f'{self.pk} / '
            + (f'title: {self.title[:10]} / ' if self.title is not None else '')
            + (f'series: {str(self.card_series)[:10]} / ' if self.card_series is not None else '')
            + (f'#{self.n_in_series} / ' if self.card_series is not None else '')
            + (
                f"tags: {str(', '.join(self.tags.values_list('name', flat=True)))[:10]} / "
                if len(self.tags.values_list('name', flat=True))
                else ''
            )
            + self.created_at.strftime('%d-%m-%Y')
        )

    class Meta:
        ordering = ['pk']
        unique_together = ('card_series', 'n_in_series')


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
    content = models.JSONField()
    position = models.PositiveSmallIntegerField(
        default=1,
        blank=False,
        null=False
    )

    class Meta:
        ordering = ['position']
        unique_together = ('card', 'position')