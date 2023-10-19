"""
Django settings for argus_server project.

Generated by 'django-admin startproject' using Django 4.2.5.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path
import os 

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-j8r*w-xtbwhe6$w0!06zi=uq44zbf-lx44_mv#nqzf!ac9u!+5'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites', # new

    'allauth', # new
    'allauth.account', # new
    'allauth.socialaccount', # new

    # custom apps go here...
    'rest_framework.authtoken',
    'base',
    'users'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    'allauth.account.middleware.AccountMiddleware'
]

ROOT_URLCONF = 'argus_server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'argus_server.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = False

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
)

SITE_ID = 1

ACCOUNT_EMAIL_VERIFICATION = 'none'

ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
    ),
}
# This enables session based authentication
SESSION_COOKIE_HTTPONLY = False

AUTH_USER_MODEL = 'users.CustomUser'

SESSION_COOKIE_AGE = 7200  # 30 minutes
SESSION_SAVE_EVERY_REQUEST = True

import configparser

config = configparser.ConfigParser()
config.read('config.ini')

LAT = config['telescope']['latitude']
LON = config['telescope']['longitude']

MAX_DISTANCE_FROM_ZENITH = float(config['telescope']['max_distance_from_zenith'])

MAX_ZENITH = float(config['telescope']['max_zenith'])
MIN_ZENITH = float(config['telescope']['min_zenith'])

MAX_AZIMUTH = float(config['telescope']['max_azimuth'])
MIN_AZIMUTH = float(config['telescope']['min_azimuth'])

FILTROS = config['telescope']['filtros'].split(',')
TIPOS_FRAME = config['telescope']['tipos_frame'].split(',')

TEMPO_MAXIMO = int(config['telescope']['tempo_maximo_reserva'])

DB_NAME = config['telescope']['db_name']

ORCHESTRATE_FOLDER = str(config['telescope']['orchestrate_folder'])
IMAGES_FOLDER = config['telescope']['images_folder']

TEMPO_FILTRO = float(config['telescope']['tempo_espera_apos_filtro'])
TEMPO_FRAME = float(config['telescope']['tempo_espera_entre_frames'])
TEMPO_DESLIZE = float(config['telescope']['tempo_espera_apos_deslizar'])

OPERATION_TIMEOUT = float(config['telescope']['tempo_maximo_operacao_telescopio'])

TEMPO_EXPOSICAO_MAXIMO = float(config['telescope']['tempo_exposicao_maximo'])

assert os.path.exists(ORCHESTRATE_FOLDER), f"Orchestrate folder ({ORCHESTRATE_FOLDER}) does not exist"
assert os.path.exists(IMAGES_FOLDER), f"Images folder ({IMAGES_FOLDER}) does not exist"