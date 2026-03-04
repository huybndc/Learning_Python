import mini_module
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Main loop
while True:
    print('-' * 36)
    print('1. Add student\n2. Add/Update score\n3. Print info\n4. Check student\n5. Delete student\n0. Exit')

    choice = input('Choice: ')

    if choice not in ['1', '2', '3', '4', '5', '0']:
        print('Error: Please choose between 0-5.')

    if choice == '0':
        break
    if choice == '1':
        mini_module.add_student()
    if choice == '2':
        mini_module.add_score()
    if choice == '3':
        mini_module.all_info()
    if choice == '4':
        mini_module.check_student()
    if choice == '5':
        mini_module.delete_student()

logging.debug('Program ended - Over')