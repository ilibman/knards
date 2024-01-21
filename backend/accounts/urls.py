from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.UserViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('users/<int:pk>/', views.UserViewSet.as_view({'get': 'retrieve', 'patch': 'update'})),
]