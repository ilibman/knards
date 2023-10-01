# Generated by Django 4.1.7 on 2023-04-06 06:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Card',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('n_in_series', models.PositiveIntegerField()),
                ('title', models.CharField(max_length=50)),
                ('score', models.PositiveSmallIntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='CardSeries',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='CardPartial',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('partial_type', models.CharField(choices=[('text', 'Text'), ('code', 'Code')], default='text', max_length=20)),
                ('content', models.TextField()),
                ('position', models.PositiveSmallIntegerField()),
                ('card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='card_partials', to='cards.card')),
            ],
            options={
                'ordering': ['position'],
            },
        ),
        migrations.AddField(
            model_name='card',
            name='card_series',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cards', to='cards.cardseries'),
        ),
        migrations.AddField(
            model_name='card',
            name='tags',
            field=models.ManyToManyField(to='cards.tag'),
        ),
    ]