// supabase.js

// 3つの分割モジュールから関数およびクライアントをインポート
import { supabase } from './supabase_client.js';
import { 
    insertParticipant, 
    updateParticipantState, 
    checkExistingParticipant, 
    deleteParticipant, 
    subscribeToParticipants 
} from './supabase_participants.js';
import { 
    getCurrentTurn, 
    updateCurrentTurn, 
    clearRoomParticipants, 
    subscribeToRoom 
} from './supabase_game.js';

// ハブ（統合窓口）としてすべての関数およびクライアントを再エクスポート
export {
    supabase,
    insertParticipant,
    updateParticipantState,
    checkExistingParticipant,
    deleteParticipant,
    subscribeToParticipants,
    getCurrentTurn,
    updateCurrentTurn,
    clearRoomParticipants,
    subscribeToRoom
};

console.log("【デバッグ】supabase.js: ハブ（統合窓口）モジュールとして正常に読み込まれました。");
