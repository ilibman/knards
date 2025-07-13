from rest_framework import routers
from . import views

router = routers.SimpleRouter()
router.register(r'card-series', views.CardSeriesViewSet, basename='card-series')
router.register(r'tags', views.TagsViewSet, basename='tags')
router.register(r'cards', views.CardsViewSet, basename='cards')
router.register(r'card-partials', views.CardPartialsViewSet, basename='card-partials')
router.register(r'card-scores', views.CardScoresViewSet, basename='card-scores')
urlpatterns = router.urls
