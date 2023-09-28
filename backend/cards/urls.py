from django.urls import path
from . import views

urlpatterns = [
    path(
        'card-series/',
        views.CardSeriesViewSet.as_view({'get': 'list'})
    ),
    path(
        'card-series/<pk>/',
        views.CardSeriesViewSet.as_view({'get': 'retrieve'})
    ),
    path('tags/', views.TagsViewSet.as_view({'get': 'list'})),
    path('tags/<pk>/', views.TagsViewSet.as_view({'get': 'retrieve'})),
    path('cards/', views.CardsViewSet.as_view({'get': 'list'})),
    path('cards/<pk>/', views.CardsViewSet.as_view({'get': 'retrieve'})),
    path(
        'card-partials/',
        views.CardPartialsViewSet.as_view({'get': 'list'})
    ),
    path(
        'card-partials/<pk>/',
        views.CardPartialsViewSet.as_view({'get': 'retrieve'})
    ),
]