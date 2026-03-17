import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s - %(levelname)s - %(message)s'
)
from config import (BASE_HP, BASE_ATK, BASE_REST, 
                          WARRIOR_HP, WARRIOR_REST, SKILL_POWER_BUFF,
                          MAGE_ATK, HEAL_ALLY)

# Class base để tạo ra các character sau này
# Không được dùng để spawn trực tiếp
class Character:
    # Thuộc tính đếm của Class để cấp ID cho từng nhân vật được tạo ra
    _id_counter = 0

    def __init__(self, hp = BASE_HP, atk = BASE_ATK) -> None:
        # Sử dụng ID thay cho name, đơn giản hoá cách chiến đấu
        self.__class__._id_counter += 1
        self.ID = f'{self.__class__.__name__} {self._id_counter}'
        self.hp = hp
        self.atk = atk
        self.max_hp = hp
        self.is_alive = True
        self.is_buffed = False
        self.buff_turns_left = 0    

    # Tạo ra một khung để buộc class con phải override để sử dụng
    # Có thể raise NotImplementError - nhưng chưa cần xài tới, cũng chưa học kĩ
    def use_skill(self, skill_name, target=None):
        pass

    def attack(self, target: 'Character'):
        damage = self.atk
        return target.take_damage(damage)    

    def take_damage(self, damage: float) -> float:
        self.hp = self.hp - damage
        if self.hp <= 0:
            return self.die()
        return self.hp
    
    def die(self):
        self.is_alive = False
        logging.debug(f'{self.ID}: Đã bị tiêu diệt!')
        return self.is_alive

    def rest(self, rest = BASE_REST) -> float:
        self.hp =  min((self.hp + rest), self.max_hp)
        return self.hp
    
    def update_status(self):
        
        # Xử lý buff
        if self.is_buffed:
            self.buff_turns_left -= 1
            if self.buff_turns_left <= 0:
                self.atk -= SKILL_POWER_BUFF   # hết buff → giảm atk
                self.is_buffed = False
    
    # Method đặc biệt của OOP
    # Dùng để thay đổi cách hiển thị của hàm print
    def __str__(self) -> str:
        return f'{self.ID:8} - {self.hp:3}/{self.max_hp:3} - atk : {self.atk}'
    
    def __repr__(self):
        return f'{self.ID:8} - {self.hp:3}/{self.max_hp:3} - atk : {self.atk}'
    
class Warrior(Character):

    # Class được kế thừa từ class Character 
    def __init__(self) -> None:
        super().__init__(hp = WARRIOR_HP)
        
    # Tách riêng hàm chỉ để gọi skill
    def use_skill(self, skill_name: str, target = None): # type: ignore
        if skill_name == 'critical_strike':
            return self.critical_strike(target) # type: ignore
        elif skill_name == 'power_up':
            return self.power_up()

    def critical_strike(self, target: 'Character'):
        # 1. tính damage
        damage = self.atk * 1.7
        # 2. gọi take_damage của target
        target.take_damage(damage)

    def power_up(self) -> float:
        self.atk += SKILL_POWER_BUFF
        self.is_buffed = True
        self.buff_turns_left = 2
        return self.atk
    
    def rest(self, rest = WARRIOR_REST) -> float:
        return super().rest(rest)
    
class Mage(Character):

    # Class cũng được kế thừa từ class Character - nhưng không thay đổi gì cả
    # Cảm giác nên thay đổi attribute gì đó để cân bằng
    def __init__(self) -> None:
        super().__init__(atk = MAGE_ATK)
            
    def use_skill(self, skill_name: str, target = None):
        # gọi method tương ứng
        if skill_name == 'aoe_attack':
                self.aoe_attack(target) # type: ignore
        elif skill_name == 'heal_ally':
            self.heal_ally(target) # type: ignore

    def heal_ally(self, target: 'Character'):
        # Cộng 35HP, không vượt max_hp
        target.hp = min(target.hp + HEAL_ALLY, target.max_hp)
    
    def aoe_attack (self, targets : list):
        damage = self.atk
        # Tấn công từng mục tiêu
        for target in targets:
            target.take_damage(damage)