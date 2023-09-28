# Generated by Django 4.2.5 on 2023-09-28 11:43

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cards', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='cardseries',
            options={'verbose_name_plural': 'card series'},
        ),
        migrations.AlterField(
            model_name='card',
            name='card_series',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='cards', to='cards.cardseries'),
        ),
        migrations.AlterField(
            model_name='card',
            name='n_in_series',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AlterField(
            model_name='card',
            name='score',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='card',
            name='tags',
            field=models.ManyToManyField(blank=True, to='cards.tag'),
        ),
        migrations.AlterField(
            model_name='card',
            name='title',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='cardpartial',
            name='position',
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.AlterUniqueTogether(
            name='card',
            unique_together={('card_series', 'n_in_series')},
        ),
        migrations.AlterUniqueTogether(
            name='cardpartial',
            unique_together={('card', 'position')},
        ),
    ]
