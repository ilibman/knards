from django.contrib import admin
from .models import CardSeries, Tag, Card, CardPartial, CardScore


class CardSeriesAdmin(admin.ModelAdmin):
    list_display = ['name',]
    search_fields = ['name',]
    list_per_page = 25

class TagAdmin(admin.ModelAdmin):
    list_display = ['name',]
    search_fields = ['name',]
    list_per_page = 25

class CardAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'n_in_series']
    search_fields = ['title',]
    list_per_page = 25

class CardPartialAdmin(admin.ModelAdmin):
    list_display = ['card', 'is_prompt', 'position']
    search_fields = ['content',]
    list_per_page = 25

class CardScoreAdmin(admin.ModelAdmin):
    list_display = ['card', 'owner', 'score', 'last_revised_at']
    list_per_page = 25
    
    
admin.site.register(CardSeries, CardSeriesAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(Card, CardAdmin)
admin.site.register(CardPartial, CardPartialAdmin)
admin.site.register(CardScore, CardScoreAdmin)