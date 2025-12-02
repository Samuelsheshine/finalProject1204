from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import json
import os

app = Flask(__name__)
# 允許所有來源跨域請求，或指定前端網址例如 origins=["http://localhost:5173"]
CORS(app)

# --- 資料庫設定 (SQLite) ---
# 資料庫檔案會建立在 server 目錄下的 studyhub.db
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, 'studyhub.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- 資料模型 ---
# 為了保持彈性並盡量不更動前端結構，我們將所有使用者資料存為一個 JSON 欄位
# 在真實專案中，可能會拆分成 Tasks, Grades 等多個 Table，但這裡為了配合前端單一 JSON 結構，使用此設計。
class UserData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # 儲存整個應用程式的狀態 (tasks, grades, timetable...)
    data_json = db.Column(db.Text, nullable=False) 

# 初始化資料庫
with app.app_context():
    db.create_all()

# --- LMStudio 設定 ---
# 這是你本地 AI 模型的 API 端點
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

@app.route('/')
def home():
    return "Study Hub Backend (with SQLite) is running!"

# --- 資料庫 API ---

@app.route('/api/data', methods=['GET'])
def get_data():
    """取得使用者資料"""
    try:
        # 假設單機版只有一個使用者，直接取第一筆
        record = UserData.query.first()
        if record:
            # 將資料庫中的 JSON 字串轉回 Python 字典再回傳
            return jsonify(json.loads(record.data_json))
        else:
            # 如果沒有資料，回傳空物件，讓前端使用預設值
            return jsonify({}) 
    except Exception as e:
        print(f"Get Data Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/data', methods=['POST'])
def save_data():
    """儲存使用者資料 (全量更新)"""
    try:
        new_data = request.json
        
        # 簡單驗證：確保送來的是字典
        if not isinstance(new_data, dict):
            return jsonify({"error": "Invalid data format"}), 400

        record = UserData.query.first()
        
        if record:
            # 更新現有資料
            record.data_json = json.dumps(new_data)
        else:
            # 建立新資料
            new_record = UserData(data_json=json.dumps(new_data))
            db.session.add(new_record)
        
        db.session.commit()
        return jsonify({"status": "success", "message": "Data saved"})
    except Exception as e:
        print(f"Save Error: {e}")
        db.session.rollback() # 發生錯誤時回滾
        return jsonify({"error": str(e)}), 500

# --- AI API ---

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    接收前端傳來的對話歷史 (messages)，轉發給 LMStudio (本地 LLM)
    這是一個 Proxy (代理) 角色，解決前端直接呼叫 LMStudio 可能遇到的 CORS 問題
    """
    try:
        data = request.json
        messages = data.get('messages', [])
        
        # 建構給 LM Studio 的請求
        payload = {
            "model": "local-model", # 模型名稱通常在 LM Studio 中設定，local-model 是通用預設
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 800,
            "stream": False
        }

        # 轉發請求
        try:
            resp = requests.post(
                LM_STUDIO_URL, 
                json=payload, 
                headers={"Content-Type": "application/json"},
                timeout=30 # 設定超時時間，避免卡住
            )
        except requests.exceptions.ConnectionError:
            return jsonify({
                "reply": "⚠️ 無法連線到本地 AI 伺服器 (LM Studio)。\n請確認：\n1. LM Studio 已開啟\n2. Local Server Server 已啟動 (Port 1234)"
            }), 200 # 回傳 200 讓前端能顯示錯誤訊息，而不是報錯

        
        if resp.status_code == 200:
            ai_response = resp.json()
            # 提取 AI 的回覆內容
            reply_content = ai_response['choices'][0]['message']['content']
            return jsonify({"reply": reply_content})
        else:
            error_msg = f"LM Studio Error: {resp.status_code} - {resp.text}"
            print(error_msg)
            return jsonify({"reply": f"AI 模型發生錯誤：{resp.status_code}"}), 200

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"error": f"伺服器內部錯誤: {str(e)}"}), 500

if __name__ == '__main__':
    # 啟動 Flask 伺服器，預設 Port 5000
    app.run(debug=True, port=5000)