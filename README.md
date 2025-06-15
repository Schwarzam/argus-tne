# Argus - Telescope in Schools

Written by Gustavo Schwarz, 2023.

[Telescopes in Schools](http://www.telescopiosnaescola.pro.br/) project.

The "Argus" is a Schmidt-Cassegrain type telescope, Celestron brand, with a 28cm aperture and 2.8m focal length. It has a CCD ST7-XE (astronomical digital camera) with red, green, blue, ultraviolet, and infrared filters. The robotic assembly, Paramount GT1100-S, can be operated remotely by any school with internet access.

It's maintained by the [Astronomy Department of IAG/USP](https://www.iag.usp.br/astronomia), at the Abrahão de Moraes Observatory located in the city of Valinhos, SP.

Also, check out the [Night with the Stars](http://www.telescopiosnaescola.pro.br/argus/noite_com_as_estrelas.php) event and come pay us a visit.

## Computer enviroment

This software was developed to run on windows 7 in the observatory's computer. It's recommended to use the same OS and python version 3.8 as the conda environment. Unfortunatelly there's no docker on windows 7, so we can't use it.

This software was developed to work with the following software versions:

```
TheSky 6    -   version 6.0.0.67
Orchestrate -   version 1.00.050
CCDSoft     -   version 5.00.218
```

## First time instalation

You should first install Anaconda. You can download it [here](https://repo.anaconda.com/archive/). The last reported version to work in Windows 7 was 2019.10. 
Direct link to the installer: [Windows 64-bit](https://repo.anaconda.com/archive/Anaconda3-2019.10-Windows-x86_64.exe)

Once Anaconda is installed you can open the anaconda cmd, go to the repository and to install the environment, run the following command in the terminal:

```bash
conda env create --file conda_env.yaml --name argus
```

This will create a new environment called argus with all the dependencies needed to run the software. To activate the environment run:

```bash
conda activate argus
```

Now go to the 'argus_server' folder and make sure config.ini is configured correctly. Then run the following command to create the database:

```bash
python manage.py migrate
```

To create a superuser run, this superuser will be able to access the admin page and create reservations for the telescope (you can create more users later with this command):

```bash
python manage.py createsuperuser
```

Lastly, configure and start nginx. Nginx will proxy the requests to the django server and serve the frontend build files. 

Unzip the nginx.zip file in the nginx folder, replace the given nginx.conf file with the one in the nginx/conf folder. Make sure to change the paths in the nginx.conf file to match your system frontend build. (replace ```C:\Users\Argus\Documents\argus-tne-main\frontend\build```). Then run the following command to start nginx:

```bash
start nginx
```

Nginx will start on port 80, so make sure no other software is using this port. It will also start automatically when you turn on the computer. You should kill it on the task manager if you want to stop it.

## Running the software

To run the software you need to activate the environment first:

```bash
conda activate argus
```

Then go to the 'argus_server' folder and run the following command:

```bash
python manage.py runserver
```

This will start the django server on port 8000. You can access the admin page on ```localhost:8000/admin```. To access the frontend go to ```localhost``` on your browser.

## Development

This was developed using Django for the server and React for the frontend. 

The backend is inside the folder `argus_server`. It's a django project, so to run it you should follow the instructions above, and in the settings.py should point to a valid postgres or sqllite database. By default you shouldn't worry about this because it's set to sqlite and it creates it self.

All the backend logic and APIs are inside the folders `base` and `users` in the `argus_server` folder. The code is well modulated and is all documented. While searching for endpoints, use ctrl + alt + f to search for all patterns, everything should be easy to find. 

The frontend follows a similar modulated logic. It's inside the frontend folder, and to run it just use the `npm i` and then `npm start` because it's a ReactJS package. 
Inside the components folder there is all pages, and the code is all documented. 

To run the frontend in development mode go to the 'frontend' folder and run the following command:

```bash
npm start
```

This will start the frontend on port 3000. To access it go to ```localhost:3000``` on your browser. The frontend will automatically reload if you make any changes to the code.

To run the server in development mode go to the 'argus_server' folder and run the following command (make sure to have the conda env):

```bash
python manage.py runserver
```
