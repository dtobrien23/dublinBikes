from flask import Flask, render_template, jsonify, request
from apscheduler.schedulers.background import BackgroundScheduler
import functools
from sqlalchemy import create_engine, text
import traceback
import time
import dbinfo
import requests
from datetime import datetime
import pickle
import pandas as pd


app = Flask(__name__)

@app.route("/")
def index():
    update_availability_cache()
    return render_template('index.html', gmkey=dbinfo.GMKEY)


engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(dbinfo.USER, dbinfo.PASSWORD, dbinfo.DB_URI, dbinfo.PORT, dbinfo.DB_NAME), echo=True)

def get_stations():
    sql = "select * from station;"
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql)).fetchall()
            print('#found {} stations', len(rows), rows)
            return [row._asdict() for row in rows]
    except:
        print(traceback.format_exc())
        return None
    

def get_weather():
    url = f"https://api.openweathermap.org/data/2.5/onecall?lat={dbinfo.LAT}&lon={dbinfo.LON}&exclude=minutely,hourly&appid={dbinfo.APP_ID}"
    try:
        response = requests.get(url)
        weather = response.json()
        return weather
    except:
        print(traceback.format_exc())
        return None
    

@app.route("/stations")
@functools.lru_cache(maxsize=128)
def stations_endpoint():
    stations = get_stations()
    if stations is not None:
        return jsonify(stations)
    else:
        return "error in get_stations", 404


# to keep data up to date
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
def weather_endpoint():
    weather = get_weather()
    if weather is not None:
        return jsonify(weather)
    else:
        return "error in get_weather", 404


# start the scheduler
scheduler.start()

# get user input to make availability prediction
@app.route("/forecast_form", methods=["POST"])
def get_inputs():
    global station_name, date_str, time_str
    station_name = request.form.get("stations")
    date_str = request.form.get("forecast_date")
    time_str = request.form.get("forecast_time")
    response = {"status": "Success", "data": {"station": station_name, "date": date_str, "time": time_str}}
    return jsonify(response)


# get user input to make availability prediction
@app.route("/predicted_availability", methods=["GET"])
def predict_availability():
    x_vars = []

    # getting station number
    station_num = 0
    stations = get_stations()
    for station in stations:
        if station["address"] == station_name:
            station_num = station["number"]
            x_vars.append(station_num) # WORKING
    
    # datetime object to get timestamp, year, month, and day of week
    date_format = "%Y-%m-%d"
    date = datetime.strptime(date_str, date_format)

    # timestamps for getting the weather forecast
    timestamp = date.timestamp()

    dt = datetime.fromtimestamp(timestamp)
    start_of_day = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    start_of_day_timestamp = start_of_day.timestamp()
    end_of_day_timestamp = end_of_day.timestamp()
    
    # month and day of week
    month = date.month
    x_vars.append(month) # WORKING
    day_of_week = date.weekday() 
    x_vars.append(day_of_week) # WORKING
    
    # time
    the_time = time.strptime(time_str, "%H:%M")
    hour = time.strftime('%H',the_time)
    x_vars.append(int(hour)) # WORKING

    # weather info
    weather = get_weather()
    forecast = weather["daily"]
    for day in forecast:
        if start_of_day_timestamp <= day["dt"] <= end_of_day_timestamp:
            x_vars.append(day["temp"]["day"])
            x_vars.append(day["weather"][0]["id"])
            x_vars.append(day["wind_speed"])
            x_vars.append(day["wind_deg"])

    # predict
    with open("models.pkl", "rb") as f:
        models = pickle.load(f)
    data_frame = []
    data_frame.append(x_vars)
    x = pd.DataFrame(data_frame, columns=["number", "month", "day", "hour", "temp", "weather_desc", "wind_speed", "wind_deg"])
    
    for model_name, model in models.items():
        if model_name == station_num:
            prediction = model.predict(x)
            pred_float = prediction.item()
            pred_bikes = int(round(pred_float))
            return jsonify(pred_bikes)
    

if __name__ == "__main__":
    app.run(debug=True)
    