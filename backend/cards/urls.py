from django.urls import path
from . import views

urlpatterns = [
    path(
        'card-series/',
        views.CardSeriesViewSet.as_view({'get': 'list', 'post': 'create'})
    ),
    path('card-series/<int:pk>/', views.CardSeriesViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
    path('tags/', views.TagsViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('tags/<int:pk>/', views.TagsViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
    path('cards/', views.CardsViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('cards/<int:pk>/', views.CardsViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
    path(
        'card-partials/',
        views.CardPartialsViewSet.as_view({'get': 'list', 'post': 'create'})
    ),
    path('card-partials/<int:pk>/', views.CardPartialsViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
    path(
        'card-scores/',
        views.CardScoresViewSet.as_view({'get': 'list', 'post': 'create'})
    ),
    path('card-scores/<int:pk>/', views.CardScoresViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }))
]