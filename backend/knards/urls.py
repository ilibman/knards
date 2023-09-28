from django.contrib import admin
from django.urls import path, include, re_path
from django.shortcuts import render

def render_react(request):
    return render(request, 'index.html')

urlpatterns = [
    path('api/cards/', include('cards.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('admin/', admin.site.urls),
    re_path(r'^$', render_react),
    re_path(r'^(?:.*)/?$', render_react),
]