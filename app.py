from flask import Flask, render_template, jsonify, request
from apscheduler.schedulers.background import BackgroundScheduler
import functools
from sqlalchemy import create_engine, text
import traceback
import time
import dbinfo
import requests
import pickle

app = Flask(__name__)

@app.route("/")
def index():
    update_availability_cache()
    return render_template('index.html', gmkey=dbinfo.GMKEY)


engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(dbinfo.USER, dbinfo.PASSWORD, dbinfo.DB_URI, dbinfo.PORT, dbinfo.DB_NAME), echo=True)

@app.route("/stations")
@functools.lru_cache(maxsize=128)
def get_stations():
    sql = "select * from station;"
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql)).fetchall()
            print('#found {} stations', len(rows), rows)
            return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_stations", 404


scheduler = BackgroundScheduler()

@scheduler.scheduled_job('interval', minutes = 5)
def update_availability_cache():
    # get current time to determine latest update for station availability
    current_time = time.time()
    # get latest update for each station, current time - 5 minutes or 300 seconds
    sql = f"select * from availability where timestamp >= ({current_time} - 300);"
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql)).fetchall()
            print('#found {} stations', len(rows), rows)
            app.config['cached_availability'] = [row._asdict() for row in rows]
    except:
        print(traceback.format_exc())


@app.route("/availability")
def get_availability():
    if 'cached_availability' in app.config:
        return jsonify(app.config['cached_availability'])
    else:
        return "no data available", 404

# get current weather and forecast data to display in the app
@app.route("/weather")
@functools.lru_cache(maxsize=128)
def get_weather():
    url = f"https://api.openweathermap.org/data/2.5/onecall?lat={dbinfo.LAT}&lon={dbinfo.LON}&exclude=minutely,hourly&appid={dbinfo.APP_ID}"
    try:
        response = requests.get(url)
        forecast = response.json()
        return forecast
    except:
        print(traceback.format_exc())
        return "error in get_stations", 404

# get user input to make availability prediction
@app.route("/predicted_availability", methods=["POST"])
def predict_availability():
    # x1 = float(request.form["x1"])
    # x2 = float(request.form["x2"])
    # x3 = float(request.form["x3"])
    # x4 = float(request.form["x4"])
    # x5 = float(request.form["x5"])

    model = pickle.load(open("predict_availability_model", "rb"))
    prediction = model.predict() # (x1, x2...)
    return prediction.json()


# start the scheduler
scheduler.start()
    

if __name__ == "__main__":
    app.run(debug=True)

    