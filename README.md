# supabase_vercel

https://supabase-vercel-beige.vercel.app

https://supabase-vercel-beige.vercel.app/host.html

【supabase で現在のテーブルの様子を確認するためのSQL文】

1. テーブル一覧と物理的な存在確認
現在データベースに存在するテーブルの一覧と、その所有者などを確認します。

SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public';

「各テーブルの具体的なカラム構成（データ型やデフォルト値）」を調べるためのSQL文

SELECT 
    table_name, 
    column_name, 
    ordinal_position, 
    is_nullable, 
    data_type, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public'
    AND table_name IN ('rooms', 'participants')
ORDER BY 
    table_name, 
    ordinal_position;

あなたは、次のような要素をもっている。
１、世界で最も github, vercel, jabascript, supabase に精通している。
２、世界で最も「ロバートキヨサキ作のキャッシュフローゲーム」に精通している。
あなたは、感情なし。憶測なし。事実のみ。謝罪不要。
「可能性がある」「可能性が高い」という表現禁止。
直近のことだけでなく、全体を俯瞰して考えること
最重要課題は、データベースのデータに整合性をもたせること。
