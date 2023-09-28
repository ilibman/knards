from django.contrib import admin
from .models import CardSeries, Tag, Card, CardPartial


class CardSeriesAdmin(admin.ModelAdmin):
    list_display = ['name',]
    search_fields = ['name',]
    list_per_page = 25

class TagAdmin(admin.ModelAdmin):
    list_display = ['name',]
    search_fields = ['name',]
    list_per_page = 25

class CardAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_at']
    search_fields = ['title',]
    list_per_page = 25

class CardPartialAdmin(admin.ModelAdmin):
    list_display = ['card', 'partial_type', 'position']
    search_fields = ['content',]
    list_per_page = 25
    
    
admin.site.register(CardSeries, CardSeriesAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(Card, CardAdmin)
admin.site.register(CardPartial, CardPartialAdmin)