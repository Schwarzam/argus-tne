from datetime import datetime
import threading
import time
import os

from base.auxiliares import files_in_directory, utc_to_brasilia
from base.executeobs import get_orchestrate_filename
from base.models import ObservationPlan, Telescope

from django.conf import settings


"""
TODO: Copy this to the docs 
possible staus telescope

[
    "starting observation",
    "executing operations",
    "error - orchestrate not watching",
    "error",
    "idle",
    "busy",
]
"""

def check_telescope_register():
    tel = Telescope.objects.filter(name=settings.DB_NAME).first()
    if tel:
        tel.delete()
        del tel
    tel = Telescope(name=settings.DB_NAME)
    reset_telescope_register(tel)
    tel.save()
        
def reset_telescope_register(telescope):
    telescope.ra = 0
    telescope.dec = 0
    telescope.alt = 0
    telescope.az = 0
    telescope.status = "idle"
    telescope.operation = None
    telescope.executing_plan_id = None
    telescope.executing_plan_name = None
    telescope.save()

def parse_done_file(file):
    """
    Parse a DONE file and return the status of the operation.
    
    Args:
        file (str): The path of the DONE file.
    
    Returns:
        str: The status of the operation.
    """
    files = []
    with open(file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            if line.startswith('TakeImage'):
                filename = line.split()[3]
                filename = os.path.basename(filename)
                files.append(filename)
    return files

def check_telescope():
    file_track_dict = {}
    N = 10
    previous_files = set()  # Store files from the previous iteration
    current_iteration = 0
    handshake_count = 0
    operation_count = 0

    print('Starting background task')
    taxa_atualizacao = 1
    check_telescope_register()
    while True:
        # Your database update logic here
        telescope = Telescope.objects.get(name=settings.DB_NAME)
        
        # Get the list of files in the directory
        fs_orchestrate_folder = files_in_directory(settings.ORCHESTRATE_FOLDER)
        for file in fs_orchestrate_folder:
            if file.startswith('.'):
                try: os.remove(os.path.join(settings.ORCHESTRATE_FOLDER, file))
                except: pass
                fs_orchestrate_folder.remove(file)
        
        # Detect files that disappeared before N iterations
        if 'Sending' in telescope.status:
            orc_name, _ = get_orchestrate_filename(telescope.executing_plan_id)
            found = False
            for file in fs_orchestrate_folder:
                if orc_name in file:
                    found = True
                    break
            if not found:
                telescope.status = "executing operations"
                telescope.save()
        
        for file in previous_files:
            if 'error' in telescope.status:
                continue
            if telescope.status == "executing operations":
                continue
            if file not in fs_orchestrate_folder:
                iterations_present = current_iteration - file_track_dict[file]['first_appearance']
                if iterations_present <= N:
                    ## extract plan_id from file name
                    telescope.status = "executing operations"
                    operation_count = 0
                    telescope.save()
                    
                # Remove file from tracking
                del file_track_dict[file]
        
        if 'idle' in telescope.status:
            operation_count = 0
        
        # Update file appearance and counts
        for file in fs_orchestrate_folder:
            if file not in file_track_dict:
                file_track_dict[file] = {'first_appearance': current_iteration, 'count': 1}
            else:
                file_track_dict[file]['count'] += taxa_atualizacao
            
            if file_track_dict[file]['count'] >= N and file != 'HANDSHAKE':
                # File has been present for more than {N} iterations!
                telescope.status = "error - orchestrate not watching"
                telescope.save()
            
        # Reset the count of files no longer present in the directory
        for file in list(file_track_dict.keys()):
            if file not in fs_orchestrate_folder:
                del file_track_dict[file]

        # Check HANDSHAKE file condition
        if len(fs_orchestrate_folder) == 1 and 'HANDSHAKE' in fs_orchestrate_folder:
            handshake_count += taxa_atualizacao
            if handshake_count >= N:
                #Only the HANDSHAKE file has been present for more than {N} iterations!
                if "error" in telescope.status:
                    reset_telescope_register(telescope)
        else:
            handshake_count = 0  # Reset handshake count if other files are present or HANDSHAKE is absent
        previous_files = fs_orchestrate_folder

        # Reset the count of files no longer present in the directory
        for file in list(file_track_dict.keys()):
            if file not in fs_orchestrate_folder:
                del file_track_dict[file]

        
        done = False
        ### If file found in DONE folder, update as done:
        if telescope.status == "executing operations":
            operation_count += taxa_atualizacao
            orc_name, _ = get_orchestrate_filename(telescope.executing_plan_id)
            
            done_folder = os.path.join(settings.ORCHESTRATE_FOLDER, "done")
            
            fs_done_folder = files_in_directory(done_folder)
            for file in fs_done_folder:
                if orc_name in file and ".ORC" in file:
                    plan = ObservationPlan.objects.get(id=telescope.executing_plan_id)
                    plan.executed = True
                    plan.executed_at = utc_to_brasilia(datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')).replace(tzinfo=None)
                    plan.outputs = str(parse_done_file(os.path.join(done_folder, file))).replace("[", "").replace("]", "").replace("'", "")
                    plan.save()
                    
                    reset_telescope_register(telescope)
            
                    done = True
            
        ### If file found in ERROR folder, update as error:
        if telescope.status == "executing operations" and done == False:
            
            orc_name, _ = get_orchestrate_filename(telescope.executing_plan_id)
            
            error_folder = os.path.join(settings.ORCHESTRATE_FOLDER, "done", "Errors")
            fs_error_folder = files_in_directory(error_folder)
            for file in fs_error_folder:
                if orc_name in file and ".ORC" in file:
                    reset_telescope_register(telescope)
                    
        
        if operation_count > settings.OPERATION_TIMEOUT:
            telescope.status = "error - timeout"
            telescope.save()
            operation_count = 0

        time.sleep(taxa_atualizacao)  # Sleep for 1 second before the next update
        
# Start the background thread when Django starts
thread = threading.Thread(target=check_telescope)
thread.daemon = True  # This makes sure the thread will exit when the main program exits
thread.start()