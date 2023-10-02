from django.db import models

# Create your models here.
class Profile:
    models.OneToOneField("app.Model", verbose_name=_(""), on_delete=models.CASCADE)