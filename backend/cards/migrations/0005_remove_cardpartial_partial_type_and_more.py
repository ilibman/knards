# Generated by Django 5.0.6 on 2024-05-12 07:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cards', '0004_alter_card_unique_together'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cardpartial',
            name='partial_type',
        ),
        migrations.AddField(
            model_name='cardpartial',
            name='partial_revision_role',
            field=models.CharField(choices=[('text', 'Text'), ('prompt', 'Prompt')], default='text', max_length=20),
        ),
    ]
