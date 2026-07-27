import sys
import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s - %(levelname)s - %(message)s'
)
from config import (BASE_HP, BASE_ATK, BASE_REST,  # type: ignore
                          WARRIOR_HP, WARRIOR_REST, SKILL_POWER_BUFF, WARRIOR_SKILL,
                          MAGE_ATK, HEAL_ALLY, MAGE_SKILL,
                          MAX_POOL, SKILL_TARGET_TYPE, NO_COST_SKILLS
                          )
from . import project_RPG_CHAR as CHAR

# Separator để phân cách các phần hiển thị
SEP  = '=' * 55
SEP2 = '-' * 55

# Người điều tiết trò chơi
class BattleManager:
    def __init__(self):
        # Quy hết tất cả về một biến duy nhất (phải sửa lại bài code rất nhiều)
        self.teams = {
                        'A': {'units': [], 'pool': MAX_POOL, 'cd': {}},
                        'B': {'units': [], 'pool': MAX_POOL, 'cd': {}}
                     }
        
        # turn_count
        self.turn_count = 0
        # current_turn
        self.current_turn = None
        
    
    def spawn(self, team_key, char_class):
        
        # Truy cập bằng key thay vì trước là bằng hardcoded variable
        team_data = self.teams[team_key]
        # Kiểm tra class
        is_warrior = char_class == CHAR.Warrior
        is_mage = char_class == CHAR.Mage

        # Check pool
        if team_data['pool'] <= 0:
            print(f"[!] Team {team_key} has no spawns left!")
            return
        
        new_char = char_class()
        
        team_data['units'].append(new_char)
        team_data['pool'] -= 1

        # Add skill vào pool    
        if is_warrior:
            team_data['cd'].setdefault('critical_strike', 0)
            team_data['cd'].setdefault('power_up', 0)
        elif is_mage:
            team_data['cd'].setdefault('aoe_attack', 0)
            team_data['cd'].setdefault('heal_ally', 0)

        print(f"[+] Spawned {new_char.ID}  (pool left: {team_data['pool']})\n")
        

    def setup_phase(self):
        print(SEP)
        print('  RPG BATTLE  —  Setup Phase')
        print(SEP)
        print()
        for _ in range(2):
            # hỏi team A / B muốn spawn gì
            for team_key in ['A', 'B']:
                while True:
                    choice = input(f"Team {team_key} - spawn (W)arrior/ (M)age: ").lower().strip()
                    if choice in ['warrior','w', 'mage','m']:
                        break
                    print('[!] Invalid choice!\n')

                if choice in ['warrior','w']:
                    self.spawn(team_key, CHAR.Warrior) # type: ignore
                else:
                    self.spawn(team_key, CHAR.Mage) # type: ignore

                print(f"{SEP2}")
                print(f"  Team A: {self.teams['A']['units']}")
                print(f"  Team B: {self.teams['B']['units']}")
                print(f"{SEP2}\n")
        self.turn_count += 1


    def start_turn(self):
        # Kiểm tra turn hiện tại và in ra
        if self.turn_count % 2 == 1:
            self.current_turn = 'A'
        else:
            self.current_turn = 'B'
        print(f"\n{SEP}")
        print(f"  Turn {self.turn_count:>3}  —  {self.current_turn}\'s move")
        print(SEP)

        # In danh sách còn sống — kèm trạng thái buff/debuff nếu có
        for key, data in self.teams.items():
            print(f" Team {key}:")
            for char in data['units']:
                if char.is_alive:
                    status = ' [BUFFED]' if char.is_buffed else 'NORMAL'
                    print(f"    {char} - {status}")
            print(SEP2)
            
    
    def _update_team_status(self):
        # Use current_turn ('A' or 'B') to fetch the right sub-dictionary
        current_data = self.teams[self.current_turn] # type: ignore

        for character in current_data['units']:
            if character.is_alive:
                character.update_status()
        
        current_CD = current_data['cd']
        for skill in current_CD:
            if current_CD[skill] > 0:
                current_CD[skill] -= 1
                
    
    def run_turn(self):
        self._update_team_status()  # đầu lượt — giảm cooldown, buff/debuff
        actor, action, target, skill_name = self.get_input() # type: ignore
        no_cost = self.apply_action(actor, action, target, skill_name)

        # Check xem được tái hành động không
        extra_action_used = False
        if no_cost and not extra_action_used:
            # chỉ được chain 1 lần duy nhất
            extra_action_used = True

            actor, action, target, skill_name = self.get_input() # type: ignore
            self.apply_action(actor, action, target, skill_name)
        self.turn_count += 1        # cuối lượt - cộng turn
        self.check_win()
        

    # Sử dụng hàm phụ để đỡ phải copy nhiều, để lấy skill    
    def _get_skill_pool(self, actor):
        # trả về dict CD đúng với class của actor
        current_CD = self.teams[self.current_turn]['cd'] # type: ignore
        
        if isinstance(actor, CHAR.Warrior):
            return {skill : cd for skill, cd in current_CD.items() if skill in WARRIOR_SKILL}
        return {skill : cd for skill, cd in current_CD.items() if skill in MAGE_SKILL}
        
        
    def _helper_spawn_get_input(self):
        while True:
            choice = input('Spawn (W)arrior/ (M)age: ').lower().strip()
            if choice in ['warrior','w', 'mage','m']:
                break
            print('[!] Invalid choice!\n')

        # xử lý spawn
        if choice in ['warrior','w']:
            self.spawn(self.current_turn, CHAR.Warrior) # type: ignore
            return None, 'spawn', None, None
        else:
            self.spawn(self.current_turn, CHAR.Mage) # type: ignore
            return None, 'spawn', None, None
    
    
    def _helper_surrender_get_input(self):
        while True:
            surrender = input('Are you (S)ure or (N)ot: ').lower().strip()
            if surrender in ['s','n']:
                break
        if surrender == 'n':
            return False

        team_surrender = self.current_turn + ' surrender' # type: ignore
        self.check_win(team_surrender) # type: ignore
        return True


    def _helper_choose_actor(self, current_alive):
        # Hiện danh sách quân còn sống của team hiện tại / Tạo sẵn biến cho opp
        if len(current_alive) == 0:
            print('[!] No units alive — spawn first!\n')
            return
        else:
            print('\nYour units:')
            for index, character in enumerate(current_alive, 1):
                print(f"  {index}. {character}")

        # Hỏi: chọn nhân vật nào? (theo index)
        while True:
            choice_char = input(f"\nSelect unit (1 - {len(current_alive)}): ").strip()
            if choice_char.isdigit() and 1 <= int(choice_char) <= len(current_alive):
                choice_char = int(choice_char)
                break
            print('[!] Invalid choice!\n')
            
        return current_alive[choice_char - 1]
    
    
    def get_opp_team(self):
        return 'B' if self.current_turn == 'A' else 'A'
    
    
    def target_tank(self, opp_alive):
        for char in opp_alive:
            if self._get_role(char) == 'tank':
                return True
        return False


    def target_dps(self, opp_alive):
        for char in opp_alive:
            if self._get_role(char) == 'dps':
                return True
        return False
    
    
    def _get_available_targets(self, actor, opp_alive):
        # Function: show_enemy(self, actor, opp_alive)
        # ---------------------------------------------------------
        # Purpose:
        # 1. Scans the 'opp_alive' list to identify if any enemy 'Warrior' units exist.
        # 2. Logic Gate:
        #    - If a Warrior is present AND the actor is attempting a single-target strike:
        #      - Display a warning: "Enemy Warrior detected! Taunt is active."
        #      - Filter the display list to ONLY show Warrior targets.
        #    - If no Warriors are present:
        #      - Display the full 'opp_alive' list as standard targets.

        if len(opp_alive) == 0:
            print('[!] No enemy targets available.\n')
            return []
        
        actor_warrior = isinstance(actor, CHAR.Warrior)
        has_tank = self.target_tank(opp_alive)
        has_mage = self.target_dps(opp_alive)

        if actor_warrior and has_tank and has_mage:
            return [char for char in opp_alive if isinstance(char, CHAR.Warrior)]

        return opp_alive

    
    def _helper_choose_target(self, actor, opp_alive, multi_target = False):

        # Gọi hàm show enemy - đồng thời để sử dụng thay opp_alive
        # Để thể hiện số lượng kẻ địch tốt hơn
        opp_avai = self._get_available_targets(actor, opp_alive)

        if not opp_avai:
            print('[!] No enemy targets available.\n')
            return

        if len(opp_avai) != len(opp_alive):
            print('\nEnemy Warrior detected! Taunt is active.')
            print('\nEnemy units:')

        for index, character in enumerate(opp_avai, 1):
            print(f"{index} : {character.ID} - {character.hp}/{character.max_hp}")

        while True:                            
            choice_opp= input(f"\nSelect target (1 - {len(opp_avai)}) or (Q)uit: ").strip()
            if choice_opp.lower() == 'q':
                return
            elif choice_opp.isdigit() and 1 <= int(choice_opp) <= len(opp_avai):
                choice_opp = int(choice_opp)
                break
            print('[!] Invalid choice!\n')

        if not multi_target or len(opp_avai) == 1:
            target = opp_avai[choice_opp - 1]
            # Chuẩn hoá - return về list để scale sau này
            return [target]

        # Xử lý chọn nhiều target
        else: 
            targets = [opp_avai[choice_opp - 1]] # type: ignore
            opp_avai_rest = opp_avai.copy()
            opp_avai_rest.pop(choice_opp - 1) # type: ignore

            print('\nRemaining enemies:')
            for index, character in enumerate(opp_avai_rest, 1):
                print(f"  {index}. {character}")

            # Kẻ địch còn lại
            while True:                            
                choice_opp= input(f"\nSelect second target (1 - {len(opp_avai_rest)}): ").strip()
                if choice_opp.isdigit() and 1 <= int(choice_opp) <= len(opp_avai_rest):
                    choice_opp = int(choice_opp)
                    break
                print('[!] Invalid choice!\n')
            targets.append(opp_avai_rest[choice_opp - 1])
        
        return targets
    
    
    def _helper_choose_ally(self, current_alive):
        # hỏi 1 đồng minh
        print('\nAllied units:')
        for index, character in enumerate(current_alive, 1):
            print(f"  {index}. {character}")

        while True:
            choice_ally = input(f"\nSelect ally (1 - {len(current_alive)}): ").strip()
            if choice_ally.isdigit() and 1 <= int(choice_ally) <= len(current_alive):
                choice_ally = int(choice_ally)
                break
            print('[!] Invalid choice!\n')
        
        target = current_alive[choice_ally - 1]
        return [target]
    
    
    def _helper_show_skill(self, actor):
        #1. Hiện danh sách skill của actor — kèm trạng thái cooldown
            skill_pool = self._get_skill_pool(actor)
            
            # Nếu tất cả các skill đều đang trong CD thì nên chọn lại
            all_in_CD = [avai for avai in skill_pool.values() if avai > 0] # type: ignore
            if len(all_in_CD) == len(skill_pool): # type: ignore
                print('Tất cả skill đều đang trong CD!')    
                return None #explicit

            print('\nSkills:')
            for index, (skill, cd) in enumerate(skill_pool.items(), 1): # type: ignore
                status = f"cooldown: {cd}" if cd > 0 else "ready"
                print(f"  {index}. {skill:<20} [{status}]")

            # Set vòng xử lý chọn skill
            while True:
                while True:
                    #2. Hỏi chọn skill nào
                    choice_skill= input(f"\nSelect skill (1 - {len(skill_pool.keys())}): ").strip() # type: ignore
                    if choice_skill.isdigit() and 1 <= int(choice_skill) <= len(skill_pool.keys()): # type: ignore
                        choice_skill = int(choice_skill)
                        break
                    print('[!] Invalid choice!\n')

                skill_keys = [skill for skill in skill_pool.keys()] # type: ignore
                skill_name = skill_keys[choice_skill - 1]

                # Sau khi người chơi chọn skill — kiểm tra cooldown trước khi thực thi
                # Nếu còn cooldown thì cho chọn lại, không mất lượt
                if skill_pool[skill_name] > 0: # type: ignore
                    print(f"[!] {skill_name} is on cooldown ({skill_pool[skill_name]} turns left)!") # type: ignore
                    continue  # ← quay lại while True bên ngoài, chọn lại        
                else:
                    return skill_name
                

    def get_input(self):

        # Set một biến current team/ skill_pool/ opp team để tái sử dụng
        current_team = self.teams[self.current_turn] # type: ignore
        current_alive = [char for char in current_team['units'] if char.is_alive]
        opp_team = self.teams[self.get_opp_team()]
        opp_alive = [char for char in opp_team['units'] if char.is_alive]

        # Set 1 vòng ngoài để nếu không thực thi được thì nên chọn lại
        # Dùng while True + continue thay vì return None để giữ người chơi
        # trong vòng lặp khi chọn sai (hết quân, hết địch...)
        while True:


            # 1. Hỏi: spawn hay chọn nhân vật?
            while True:
                choice = input('\n[S]pawn / [A]ction / (Q)uit = Surrender: ').lower().strip()
                if choice in ['s', 'a','q']:
                    break
                print('[!] Invalid choice!\n')

            # 1.5. Nếu nhận thua
            if choice == 'q':
                if not self._helper_surrender_get_input():
                    continue

            # 2. Nếu spawn:
            # Hỏi: Warrior hay Mage?
            if choice == 's':
                return self._helper_spawn_get_input()

            # 3. Nếu chọn nhân vật:
            else:
                actor = self._helper_choose_actor(current_alive)
                if not actor:
                    continue

                # Hỏi: hành động gì? attack / skill / rest
                while True:
                    choice_act = input('[A]ttack / [S]kill / [R]est: ').strip().upper()
                    if choice_act in ['A','S','R']:
                        break
                    print('[!] Invalid choice!\n')

                # Nếu attack: hỏi mục tiêu
                if choice_act == 'A':
                    target = self._helper_choose_target(actor, opp_alive)
                    if not target:
                        continue
                    return actor, 'attack', target, None
                
                # Nếu skill: hỏi skill nào
                elif choice_act == 'S':
                    skill_name = self._helper_show_skill(actor)
                    if skill_name is None:
                        continue

                    #3. Nếu skill cần target → hỏi target / Nếu không thì return
                    if SKILL_TARGET_TYPE[skill_name] == 'enemy_single':
                        target = self._helper_choose_target(actor, opp_alive)
                        if not target:
                            continue
                        return actor, 'skill', target, skill_name
                    
                    elif SKILL_TARGET_TYPE[skill_name] == 'ally_single':
                        target = self._helper_choose_ally(current_alive)
                        if not target:
                            continue
                        return actor, 'skill', target, skill_name
                    
                    elif SKILL_TARGET_TYPE[skill_name] == 'enemy_multi':               
                        target = self._helper_choose_target(actor, opp_alive, multi_target=True)
                        if not target:
                            continue
                        return actor, 'skill', target, skill_name

                    # None - không cần target        
                    else:
                        return actor, 'skill', None, skill_name

                # Nếu rest: thực thi
                else:
                    return actor, 'rest', None, None


    def _get_role(self, char):
       return char.role


    def _calculate_damage(self, actor, t, has_tank):
        damage = actor.atk
        actor_role = self._get_role(actor)
        target_role = self._get_role(t)

        if actor_role == 'dps' and target_role == 'dps' and has_tank:
            damage *= 0.4
        return round(damage)


    def apply_action(self, actor, action, target, skill_name):
        # Biến tái sử dụng
        opp_team = self.teams[self.get_opp_team()]
        opp_alive = [char for char in opp_team['units'] if char.is_alive]
        has_tank = self.target_tank(opp_alive)

        # spawn đã xử lý trong get_input rồi
        if action == 'spawn':
            pass

        elif action == 'attack':
            for t in target:
                actor_role = self._get_role(actor)
                target_role = self._get_role(t)

                # Xử lý trường hợp mage tấn công mage khi có warrior
                damage = self._calculate_damage(actor, t, has_tank)
                t.take_damage(damage)
                if actor_role == 'dps' and target_role == 'dps' and has_tank:
                    print(f"  >> {actor.ID} attacks {t.ID}  [{damage} dmg, reduced x0.4]")
                # Các trường hợp bình thường
                else:
                    print(f"  >> {actor.ID} attacks {t.ID}  [{damage} dmg]")
            return
        
        elif action == 'skill':
            current_CD = self.teams[self.current_turn]['cd'] # type: ignore
            target_type = SKILL_TARGET_TYPE[skill_name]

            if skill_name == 'aoe_attack':
                for t in target:
                    damage = self._calculate_damage(actor, t, has_tank)
                    t.take_damage(damage)
                    print(f"  >> {actor.ID} AOE → {t.ID}  [{round(damage)} dmg]")
                current_CD['aoe_attack'] = 3
                return
            else:
                if target_type in ['enemy_single', 'ally_single']:
                    actor.use_skill(skill_name, target[0])
                    print(f"  >> {actor.ID} used [{skill_name}] on {target[0].ID}")
                else:
                    actor.use_skill(skill_name, target)
                    print(f"  >> {actor.ID} used [{skill_name}]")

                # Set CD cho từng skill
                if skill_name in ['power_up', 'heal_ally']:
                    current_CD[skill_name] = 2
                else:
                    current_CD[skill_name] = 3
                
                # Nếu xài skill không mất lượt thì được dùng thêm hành động
                if skill_name in NO_COST_SKILLS:
                    logging.debug('  >> No cost skill - không tốn lượt.\n')
                    print('Chỉ được xài thêm 1 lần hành động.')
                    return True

        elif action == 'rest':
            before = actor.hp
            actor.rest()
            print(f"  >> {actor.ID} rested  [+{round(actor.hp - before)} HP → {actor.hp}/{actor.max_hp}]")


    def check_win(self, SURRENDER = None):
        results = {}
        for key, data in self.teams.items():
            alive_count = len([char for char in data['units'] if char.is_alive])
            has_lost = (data['pool'] <= 0 and alive_count == 0) or SURRENDER == f"{key} surrender"
            results[key] = has_lost

        if results['A']:
            print(f"\n{SEP}\n  ★  TEAM B WINS!  ★\n{SEP}")
            sys.exit()
        if results['B']:
            print(f"\n{SEP}\n  ★  TEAM A WINS!  ★\n{SEP}")
            sys.exit()