from collections import defaultdict
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.debug('Class Management Project - Start')

# Each student has a score dictionary
# Automatically create an empty dict if the student does not exist
# Limit to 5 students for easier testing
students = defaultdict(dict)
MAX = 5

# It is better to keep this tuple as a global variable
SUBJECTS = ('Math', 'Physics', 'Chemistry', 'English', 'Literature')


# Add a student and create an empty score dictionary
def add_student():
    if len(students) >= MAX:
        logging.error('Student list is full!')
        return
    else:
        name = input('Enter student name: ')

        # Prevent overly long names or duplicated names
        if len(name) > 20:
            logging.warning('Name too long, possible input error.')
            return
        else:
            for existing_name in students:
                if name == existing_name:
                    logging.warning('Student already exists. Please check again.')
                    return
            else:
                # Create default key 'Average' for future extensions
                students[name] = {'Average': 0}

    logging.debug(f'Student {name} added successfully!')
    return


# Calculate average score and ranking
def avg_and_ranking(name):
    # Filter subjects that currently have scores
    current_scores = [
        students[name][subject]
        for subject in SUBJECTS
        if subject in students[name]
    ]
    total_subjects = len(current_scores)

    if total_subjects == 0:
        students[name]['Average'] = 0
        students[name]['Rank'] = 'No scores yet'
        return

    # Calculate average score
    avg = sum(current_scores) / total_subjects
    students[name]['Average'] = round(avg, 2)

    # Ranking logic
    # List subjects with failing scores (<4)
    weak_subjects = [
        subject
        for subject in SUBJECTS
        if subject in students[name] and students[name][subject] < 4
    ]

    if total_subjects >= 3:
        # Restriction due to failing subjects
        if avg >= 8:
            rank = 'Excellent' if len(weak_subjects) == 0 else 'Good (Failing subject)'
        elif avg >= 6.5:
            rank = 'Good'
        else:
            rank = 'Average'
    else:
        rank = 'Not ranked (Need at least 3 subjects)'

    students[name]['Rank'] = rank

    print("-" * 20)
    print(f"Student: {name}")
    print(f"Number of subjects: {total_subjects}")
    if len(weak_subjects) > 0:
        print(f"Failing subjects ({len(weak_subjects)}): {weak_subjects}")
    print(f"Average score: {students[name]['Average']}")
    print(f"Rank: {rank}")


# Currently limited to (Math, Physics, Chemistry, English, Literature)
def add_score():
    global SUBJECTS

    name = input('Enter student name: ')

    if name not in students:
        logging.warning('Student not found in the system!')
        return
    else:
        # Loop to add or update scores
        while True:
            subject = input(f'Enter subject ({", ".join(SUBJECTS)} or quit): ')

            # Exit condition
            if subject.lower() == 'quit':
                break
            elif subject not in SUBJECTS:
                print('Error: Invalid subject.\n')
                continue

            try:
                score = float(input(f'Enter score for {subject}: '))
                if 0 <= score <= 10:
                    # Add or overwrite subject score
                    students[name][subject] = score
                    print(f"Score for {subject} updated.")
                else:
                    print('Error: Score must be between 0 and 10.')
            except ValueError:
                print('Error: Please enter a valid number.')

    avg_and_ranking(name)


def all_info():
    logging.debug(f'Current number of students: {len(students)}')

    if len(students) == 0:
        logging.warning('Error: Student list is empty!\n')
        return
    else:
        while True:
            print('1. Print names only\n2. Print full information\n0. Quit')
            choice = input('Choice: ')

            if choice not in '12':
                print('Error: Please choose between 0-2.')

            if choice == '0':
                break

            if choice == '1':
                print('-' * 20)
                for index, name in enumerate(students, 1):
                    print(f'{index}. Student {name}')
                return

            if choice == '2':
                print(f"{'No':<5} {'Name':<15} {'Average':<10} {'Rank'}")
                print('-' * 45)

                for index, (name, data) in enumerate(students.items(), 1):
                    avg = data.get('Average', 'N/A')
                    rank = data.get('Rank', 'N/A')
                    print(f"{index:<5} {name:<15} {avg:<10} {rank}")
            return


# Currently not very useful, but will be if MAX increases
def check_student():
    if len(students) == 0:
        logging.warning('Error: Student list is empty!')
        return

    name = input('Enter student name: ')
    if name not in students:
        logging.warning('Error: Student not found!')
        return
    else:
        data = students[name]
        print('-' * 20)
        print(f'Student: {name}')
        print(f'Average: {data.get("Average", "N/A")}')
        print(f'Rank: {data.get("Rank", "N/A")}')

        # Print subject scores
        for subject, score in data.items():
            if subject not in ('Average', 'Rank'):
                print(f'{subject}: {score}')


def delete_student():
    logging.debug(f'Current number of students: {len(students)}')

    if len(students) == 0:
        logging.warning('Error: Student list is empty!')
        return

    print('-' * 20)
    for index, name in enumerate(students, 1):
        print(f'{index}. Student {name}')

    name = input('Enter student name to delete: ')
    if name not in students:
        logging.warning('Error: Student not found!')
        return
    else:
        del students[name]
        logging.debug(f'Student {name} deleted successfully.')
        return