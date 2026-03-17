import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s - %(levelname)s - %(message)s'
)

import Modules.project_RPG_BM as BM_M
import Modules.project_RPG_CHAR as CHAR

BM = BM_M.BattleManager()
BM.setup_phase()
while True:
    BM.start_turn()
    BM.run_turn()
    if BM.check_win():
        break