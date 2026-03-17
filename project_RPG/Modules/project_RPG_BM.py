import sys
import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s - %(levelname)s - %(message)s'
)
from config import (BASE_HP, BASE_ATK, BASE_REST, 
                          WARRIOR_HP, WARRIOR_REST, SKILL_POWER_BUFF,
                          MAGE_ATK, HEAL_ALLY,
                          MAX_POOL, SKILL_TARGET_TYPE, NO_COST_SKILLS
                          )
from . import project_RPG_CHAR as CHAR

# Separator để phân cách các phần hiển thị
SEP  = '=' * 55
SEP2 = '-' * 55

# Người điều tiết trò chơi
class BattleManager:
    def __init__(self):
        # team_a, team_b
        self.team_A = []
        self.team_B = []
        # CD (Skill + cooldowns) của cả 2 team
        self.team_CD_A = {}
        self.team_CD_B = {}
        # spawn_pool — mỗi bên có MAX_POOL lượt spawn trong cả game
        self.spawn_pool_a = MAX_POOL
        self.spawn_pool_b = MAX_POOL
        # turn_count
        self.turn_count = 0
        # current_turn
        self.current_turn = None
    
    def spawn(self, team: list, char_class):
        
        # Kiểm tra class
        is_warrior = char_class == CHAR.Warrior
        is_mage = char_class == CHAR.Mage

        if team == self.team_A:
            # Check pool
            if self.spawn_pool_a <= 0:
                print('[!] Team A has no spawns left!')
                return
            new_char = char_class()
            self.team_A.append(new_char)
            self.spawn_pool_a -= 1

            # Add skill vào pool    
            if is_warrior:
                self.team_CD_A.setdefault('critical_strike', 0)
                self.team_CD_A.setdefault('power_up', 0)
            elif is_mage:
                self.team_CD_A.setdefault('aoe_attack', 0)
                self.team_CD_A.setdefault('heal_ally', 0)

            print(f'[+] Spawned {new_char.ID}  (pool left: {self.spawn_pool_a})\n')
        elif team == self.team_B:
            if self.spawn_pool_b <= 0:
                print('[!] Team B has no spawns left!')
                return
            new_char = char_class()
            self.team_B.append(new_char)
            self.spawn_pool_b -= 1

            if is_warrior:
                self.team_CD_B.setdefault('critical_strike', 0)
                self.team_CD_B.setdefault('power_up', 0)
            elif is_mage:
                self.team_CD_B.setdefault('aoe_attack', 0)
                self.team_CD_B.setdefault('heal_ally', 0)

            print(f'[+] Spawned {new_char.ID}  (pool left: {self.spawn_pool_b})\n')

    def setup_phase(self):
        print(SEP)
        print('  RPG BATTLE  —  Setup Phase')
        print(SEP)
        print()
        for _ in range(2):
            # hỏi team A muốn spawn gì
            while True:
                choice = input('Team A - spawn (W)arrior/ (M)age: ').lower().strip()
                if choice in ['warrior','w', 'mage','m']:
                    break
                logging.debug('Invalid choice!\n')

            if choice in ['warrior','w']:
                self.spawn(self.team_A, CHAR.Warrior)
            else:
                self.spawn(self.team_A, CHAR.Mage)

            # hỏi team B muốn spawn gì
            while True:
                choice = input('Team B - spawn (W)arrior/ (M)age: ').lower().strip()
                if choice in ['warrior','w', 'mage','m']:
                    break
                logging.debug('Invalid choice!\n')

            # gọi self.spawn(self.team_B, ...)
            if choice in ['warrior','w']:
                self.spawn(self.team_B, CHAR.Warrior)
            else:
                self.spawn(self.team_B, CHAR.Mage)
            print(f'{SEP2}')
            print(f'  Team A: {self.team_A}')
            print(f'  Team B: {self.team_B}')
            print(f'{SEP2}\n')
        self.turn_count += 1

    def start_turn(self):
        # Kiểm tra turn hiện tại và in ra
        if self.turn_count % 2 == 1:
            self.current_turn = 'Team A'
        else:
            self.current_turn = 'Team B'
        print(f'\n{SEP}')
        print(f'  Turn {self.turn_count:>3}  —  {self.current_turn}\'s move')
        print(SEP)

        # In danh sách còn sống — kèm trạng thái buff/debuff nếu có
        alive_A = [character for character in self.team_A if character.is_alive]
        alive_B = [character for character in self.team_B if character.is_alive]
        print('  Team A:')
        for char in alive_A:
            status = ' [BUFFED]' if char.is_buffed else 'NORMAL'
            print(f'    {char} - {status}')
        print('  Team B:')
        for char in alive_B:
            status = ' [BUFFED]' if char.is_buffed else 'NORMAL'
            print(f'    {char} - {status}')
        print(SEP2)
    
    def _update_team_status(self):
        current_team = self.team_A if self.current_turn == 'Team A' else self.team_B
        for character in current_team:
            if character.is_alive:
                character.update_status()
        
        current_CD = self.team_CD_A if self.current_turn == 'Team A' else self.team_CD_B
        for skill in current_CD:
            if current_CD[skill] > 0:
                current_CD[skill] -= 1

    def run_turn(self):
        self._update_team_status()  # đầu lượt — giảm cooldown, buff/debuff
        actor, action, target, skill_name = self.get_input() # type: ignore
        no_cost = self.apply_action(actor, action, target, skill_name)

        # Check xem được tái hành động không
        if no_cost:
            actor, action, target, skill_name = self.get_input() # type: ignore
            self.apply_action(actor, action, target, skill_name)
        self.turn_count += 1        # cuối lượt - cộng turn
        self.check_win()

    # Sử dụng hàm phụ để đỡ phải copy nhiều, để lấy skill    
    def _get_skill_pool(self, actor):
        # trả về dict CD đúng với class của actor
        current_CD = self.team_CD_A if self.current_turn == 'Team A' else self.team_CD_B
        if isinstance(actor, CHAR.Warrior):
            return {k: v for k, v in current_CD.items() if k in ['critical_strike', 'power_up']}
        elif isinstance(actor, CHAR.Mage):
            return {k: v for k, v in current_CD.items() if k in ['aoe_attack', 'heal_ally']}
        
    def get_input(self):
        # Set 1 vòng ngoài để nếu không thực thi được thì nên chọn lại
        # Dùng while True + continue thay vì return None để giữ người chơi
        # trong vòng lặp khi chọn sai (hết quân, hết địch...)
        while True:
            # Set một biến current team/ skill_pool/ opp team để tái sử dụng
            current_team = self.team_A if self.current_turn == 'Team A' else self.team_B
            current_team_skill = self.team_CD_A if self.current_turn == 'Team A' else self.team_CD_B
            opp_team = self.team_B if self.current_turn == 'Team A' else self.team_A

            # 1. Hỏi: spawn hay chọn nhân vật?
            while True:
                choice = input('\n[S]pawn / [A]ction / (Q)uit = Surrender: ').lower().strip()
                if choice in ['s', 'a','q']:
                    break
                logging.debug('Invalid choice!\n')

            # 1.5. Nếu nhận thua
            if choice == 'q':
                    while True:
                        surrender = input('Are you (S)ure or (N)ot: ').lower().strip()
                        if surrender in ['s','n']:
                            break
                    if surrender == 'n':
                        continue

                    team_surrender = self.current_turn + ' surrender' # type: ignore
                    self.check_win(team_surrender) # type: ignore
            # 2. Nếu spawn:
            # Hỏi: Warrior hay Mage?
            if choice == 's':
                while True:
                    choice = input('Spawn (W)arrior/ (M)age: ').lower().strip()
                    if choice in ['warrior','w', 'mage','m']:
                        break
                    logging.debug('Invalid choice!\n')

                # xử lý spawn
                if choice in ['warrior','w']:
                    self.spawn(current_team, CHAR.Warrior)
                    return None, 'spawn', None, None
                else:
                    self.spawn(current_team, CHAR.Mage)
                    return None, 'spawn', None, None

            # 3. Nếu chọn nhân vật:
            else:
                # Hiện danh sách quân còn sống của team hiện tại / Tạo sẵn biến cho opp
                current_alive = [character for character in current_team if character.is_alive]
                opp_alive = [character for character in opp_team if character.is_alive]
                if len(current_alive) == 0:
                    print('[!] No units alive — spawn first!\n')
                    continue
                else:
                    print('\nYour units:')
                    for index, character in enumerate(current_alive, 1):
                        print(f'  {index}. {character}')

                # Hỏi: chọn nhân vật nào? (theo index)
                while True:
                    choice_char = input(f'\nSelect unit (1 - {len(current_alive)}): ').strip()
                    if choice_char.isdigit() and 1 <= int(choice_char) <= len(current_alive):
                        choice_char = int(choice_char)
                        break
                    logging.debug('Invalid choice!\n')
                    
                actor = current_alive[choice_char - 1]
                # Hỏi: hành động gì? attack / skill / rest
                while True:
                    choice_act = input('[A]ttack / [S]kill / [R]est: ').strip().upper()
                    if choice_act in ['A','S','R']:
                        break
                    logging.debug('Invalid choice!\n')

                # Nếu attack: hỏi mục tiêu
                if choice_act == 'A':
                    if len(opp_alive) == 0:
                        print('[!] No enemy targets available.\n')
                        continue
                    else:
                        print('\nEnemy units:')
                        for index, character in enumerate(opp_alive, 1):
                            print(f'  {index}. {character}')
                    while True:                            
                        choice_opp= input(f'\nSelect target (1 - {len(opp_alive)}): ').strip()
                        if choice_opp.isdigit() and 1 <= int(choice_opp) <= len(opp_alive):
                            choice_opp = int(choice_opp)
                            break
                        logging.debug('Invalid choice!\n')

                    target = opp_alive[choice_opp - 1]
                    return actor, 'attack', target, None
                
                # Nếu skill: hỏi skill nào
                elif choice_act == 'S':
                    #1. Hiện danh sách skill của actor — kèm trạng thái cooldown
                    skill_pool = self._get_skill_pool(actor)
                    
                    # Nếu tất cả các skill đều đang trong CD thì nên chọn lại
                    all_in_CD = [avai for avai in skill_pool.values() if avai > 0] # type: ignore
                    if len(all_in_CD) == len(skill_pool): # type: ignore
                        print('Tất cả skill đều đang trong CD!')    
                        continue

                    print('\nSkills:')
                    for index, (skill, cd) in enumerate(skill_pool.items(), 1): # type: ignore
                        status = f'cooldown: {cd}' if cd > 0 else 'ready'
                        print(f'  {index}. {skill:<20} [{status}]')

                    # Set vòng xử lý chọn skill
                    # Dùng while True để cho chọn lại nếu skill đang cooldown
                    while True:
                        #2. Hỏi chọn skill nào
                        while True:
                            choice_skill= input(f'\nSelect skill (1 - {len(skill_pool.keys())}): ').strip() # type: ignore
                            if choice_skill.isdigit() and 1 <= int(choice_skill) <= len(skill_pool.keys()): # type: ignore
                                choice_skill = int(choice_skill)
                                break
                            logging.debug('Invalid choice!\n')

                        skill_keys = [skill for skill in skill_pool.keys()] # type: ignore
                        skill_name = skill_keys[choice_skill - 1]

                        # Sau khi người chơi chọn skill — kiểm tra cooldown trước khi thực thi
                        # Nếu còn cooldown thì cho chọn lại, không mất lượt
                        if skill_pool[skill_name] > 0: # type: ignore
                            print(f'[!] {skill_name} is on cooldown ({skill_pool[skill_name]} turns left)!') # type: ignore
                            continue  # ← quay lại while True bên ngoài, chọn lại

                        #3. Nếu skill cần target → hỏi target / Nếu không thì return
                        if SKILL_TARGET_TYPE[skill_name] == 'enemy_single':
                            # hỏi 1 kẻ địch
                            if len(opp_alive) == 0:
                                print('[!] No enemy targets available.\n')
                                continue
                            else:
                                print('\nEnemy units:')
                                for index, character in enumerate(opp_alive, 1):
                                    print(f'  {index}. {character}')
                            while True:                            
                                choice_opp= input(f'\nSelect target (1 - {len(opp_alive)}): ').strip()
                                if choice_opp.isdigit() and 1 <= int(choice_opp) <= len(opp_alive):
                                    choice_opp = int(choice_opp)
                                    break
                                logging.debug('Invalid choice!\n')

                            target = opp_alive[choice_opp - 1]
                            return actor, 'skill', target, skill_name
                        
                        elif SKILL_TARGET_TYPE[skill_name] == 'ally_single':
                            # hỏi 1 đồng minh
                            print('\nAllied units:')
                            for index, character in enumerate(current_alive, 1):
                                print(f'  {index}. {character}')

                            while True:
                                choice_ally = input(f'\nSelect ally (1 - {len(current_alive)}): ').strip()
                                if choice_ally.isdigit() and 1 <= int(choice_ally) <= len(current_alive):
                                    choice_ally = int(choice_ally)
                                    break
                                logging.debug('Invalid choice!\n')
                    
                            target = current_alive[choice_ally - 1]
                            return actor, 'skill', target, skill_name
                        
                        elif SKILL_TARGET_TYPE[skill_name] == 'enemy_multi':
                            # hỏi tối đa 2 kẻ địch
                            if len(opp_alive) == 0:
                                print('[!] No enemy targets available.\n')
                                continue
                            else:
                                print('\nEnemy units:')
                                for index, character in enumerate(opp_alive, 1):
                                    print(f'  {index}. {character}')

                            while True:                            
                                choice_opp= input(f'\nSelect first target (1 - {len(opp_alive)}): ').strip()
                                if choice_opp.isdigit() and 1 <= int(choice_opp) <= len(opp_alive):
                                    choice_opp = int(choice_opp)
                                    break
                                logging.debug('Invalid choice!\n')
                            
                            if len(opp_alive) == 1:
                                target = opp_alive[choice_opp - 1]
                                return actor, 'skill', target, skill_name
                            
                            else:
                                target = [opp_alive[choice_opp - 1]]
                                opp_alive_rest = opp_alive.copy()
                                opp_alive_rest.pop(choice_opp - 1)

                                print('\nRemaining enemies:')
                                for index, character in enumerate(opp_alive_rest, 1):
                                    print(f'  {index}. {character}')

                                # Kẻ địch còn lại
                                while True:                            
                                    choice_opp= input(f'\nSelect second target (1 - {len(opp_alive_rest)}): ').strip()
                                    if choice_opp.isdigit() and 1 <= int(choice_opp) <= len(opp_alive_rest):
                                        choice_opp = int(choice_opp)
                                        break
                                    logging.debug('Invalid choice!\n')
                                target.append(opp_alive_rest[choice_opp - 1])
                                return actor, 'skill', target, skill_name

                        # None - không cần target        
                        else:
                            return actor, 'skill', None, skill_name

                # Nếu rest: thực thi
                else:
                    return actor, 'rest', None, None

    def apply_action(self, actor, action, target, skill_name):
        # Biến tái sử dụng
        opp_team = self.team_B if self.current_turn == 'Team A' else self.team_A
        has_warrior = False
        for c in opp_team:
            if isinstance(c, CHAR.Warrior) and c.is_alive:
                has_warrior = True
                break

        actor_warrior = isinstance(actor, CHAR.Warrior)
        actor_mage = isinstance(actor, CHAR.Mage)
        target_mage = isinstance(target, CHAR.Mage)

        # spawn đã xử lý trong get_input rồi
        if action == 'spawn':
            pass

        elif action == 'attack':
            if actor_warrior and has_warrior and target_mage:
                print('[!] Cannot attack Mage while enemy Warrior is alive!')
                return
            if actor_mage and has_warrior and target_mage:
                damage = round(actor.atk * 0.4)
                target.take_damage(damage)
                print(f'  >> {actor.ID} attacks {target.ID}  [{damage} dmg, reduced x0.4]')
                return
            damage = actor.atk
            actor.attack(target)
            print(f'  >> {actor.ID} attacks {target.ID}  [{damage} dmg]')
        
        elif action == 'skill':
            current_CD = self.team_CD_A if self.current_turn == 'Team A' else self.team_CD_B

            if skill_name == 'critical_strike':
                if actor_warrior and has_warrior and target_mage:
                    print('[!] Cannot attack Mage while enemy Warrior is alive!')
                    return
            # aoe_attack: target là list
            if skill_name == 'aoe_attack':
                if isinstance(target, list):
                    for t in target:
                        damage = actor.atk
                        if isinstance(t, CHAR.Mage) and has_warrior:
                            damage *= 0.4
                        t.take_damage(damage)
                        print(f'  >> {actor.ID} AOE → {t.ID}  [{round(damage)} dmg]')
                current_CD['aoe_attack'] = 3
                return
            else:
                actor.use_skill(skill_name, target)

                # Set CD cho từng skill
                if skill_name in ['power_up', 'heal_ally']:
                    current_CD[skill_name] = 2
                else:
                    current_CD[skill_name] = 3

                logging.debug(f'  >> {actor.ID} used [{skill_name}]')
                
                # Nếu xài skill không mất lượt thì được dùng thêm hành động
                if skill_name in NO_COST_SKILLS:
                    logging.debug('  >> No cost skill - không tốn lượt.')
                    return True

        elif action == 'rest':
            before = actor.hp
            actor.rest()
            print(f'  >> {actor.ID} rested  [+{round(actor.hp - before)} HP → {actor.hp}/{actor.max_hp}]')

    def check_win(self, SURRENDER = None):
        alive_A = [c for c in self.team_A if c.is_alive]
        alive_B = [c for c in self.team_B if c.is_alive]
        
        # Thua khi hết spawn pool VÀ hết quân trên sân
        # Hoặc đầu hàng
        if (self.spawn_pool_a <= 0 and len(alive_A) == 0) or SURRENDER == 'Team A surrender':
            print(f'\n{SEP}')
            print('  ★  TEAM B WINS!  ★')
            print(SEP)
            sys.exit()
        if (self.spawn_pool_b <= 0 and len(alive_B) == 0) or SURRENDER == 'Team B surrender':
            print(f'\n{SEP}')
            print('  ★  TEAM A WINS!  ★')
            print(SEP)
            sys.exit()
        return False