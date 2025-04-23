from typing import Any
import requests
import datetime
import os
from mcp.server.fastmcp import FastMCP

# 환경 변수 로드 시도(옵션)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("dotenv 패키지가 설치되지 않았습니다. 환경 변수는 시스템에서 직접 로드됩니다.")

# Initialize FastMCP server
mcp = FastMCP("weather")

# 환경 변수에서 API 키 가져오기
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
if not WEATHER_API_KEY:
    print("경고: WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.")


# 단기예보 API 정보
FORECAST_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"

def make_api_request(url: str, params: dict) -> dict[str, Any] | None:
    """공공 데이터 포털 API에 요청을 보내고 응답을 처리합니다."""
    try:
        response = requests.get(url, params=params, timeout=30.0)
        print(f"API 요청 URL: {response.url}")  # 디버깅용 URL 출력
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"API 요청 중 오류 발생: {e}")
        return None

def get_base_time() -> tuple[str, str]:
    """현재 시간을 기준으로 가장 최근의 기상청 발표 시간을 반환합니다."""
    # 현재 시간 정보 생성
    now = datetime.datetime.now()
    
    # 기준 시간 구하기 (3시간 단위로 발표: 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00)
    base_times = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300']
    current_hour = now.hour
    current_minute = now.minute
    
    # 첫 발표 시간(0200) 이전이면 전 날 발표를 사용
    if current_hour < 2:
        base_date = (now - datetime.timedelta(days=1)).strftime("%Y%m%d")
        base_time = '2300'
    else:
        for i, base_time in enumerate(base_times):
            if current_hour < int(base_time[:2]) or (current_hour == int(base_time[:2]) and current_minute < 10):
                # API 발표 후 실제 데이터가 업데이트되는데 약간의 시간이 필요하므로, 
                # 발표 시간에서 10분을 더 기다림
                if i == 0:
                    # 첫 번째 발표 시간보다 이전인 경우 전날 마지막 발표
                    base_date = (now - datetime.timedelta(days=1)).strftime("%Y%m%d")
                    base_time = base_times[-1]
                else:
                    base_date = now.strftime("%Y%m%d")
                    base_time = base_times[i-1]
                break
        else:
            # 모든 발표 시간이 지난 경우 오늘 마지막 발표
            base_date = now.strftime("%Y%m%d")
            base_time = base_times[-1]
    
    return base_date, base_time

def parse_weather_data(items: list) -> dict:
    """기상청 API 응답 데이터를 시간대별로 구조화합니다."""
    # 예보 데이터 정리
    forecasts = {}
    
    for item in items:
        fcst_date = item.get('fcstDate')
        fcst_time = item.get('fcstTime')
        category = item.get('category')
        value = item.get('fcstValue')
        
        key = f"{fcst_date}_{fcst_time}"
        
        if key not in forecasts:
            forecasts[key] = {}
        
        forecasts[key][category] = value
    
    return forecasts

def format_forecast(forecasts: dict, limit: int = 8) -> list:
    """가공된 예보 데이터를 사용자가 읽기 싶은 형태로 변환합니다."""
    # 예보 시간별로 정렬
    sorted_keys = sorted(forecasts.keys())
    
    # 예보 메시지 생성
    results = []
    
    for i, key in enumerate(sorted_keys[:limit]):  # 지정된 개수의 시간대만 표시
        date_str = key.split('_')[0]
        time_str = key.split('_')[1]
        date_format = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        time_format = f"{time_str[:2]}:{time_str[2:4]}"
        time_label = f"{date_format} {time_format}"
        
        data = forecasts[key]
        
        # 하늘상태(SKY) 코드 변환
        sky_condition = {
            '1': '맑음',
            '3': '구름많음',
            '4': '흐림'
        }.get(data.get('SKY', ''), '알 수 없음')
        
        # 강수형태(PTY) 코드 변환
        precipitation_type = {
            '0': '없음',
            '1': '비',
            '2': '비/눈',
            '3': '눈',
            '4': '소나기'
        }.get(data.get('PTY', ''), '알 수 없음')
        
        temp = data.get('TMP', '알 수 없음')  # 기온
        pop = data.get('POP', '알 수 없음')   # 강수확률
        humidity = data.get('REH', '알 수 없음')  # 습도
        wind_speed = data.get('WSD', '알 수 없음')  # 풍속
        
        forecast_text = f"""
{time_label}:
기온: {temp}°C
날씨: {sky_condition}
강수형태: {precipitation_type}
강수확률: {pop}%
습도: {humidity}%
풍속: {wind_speed}m/s
"""
        results.append(forecast_text)
    
    return results

@mcp.tool()
def get_forecast(nx: int, ny: int) -> str:
    """기상청 좌표계(X,Y) 기준으로 단기 예보를 조회합니다.

    Args:
        nx: 기상청 X좌표 (예: 서울 중구 60)
        ny: 기상청 Y좌표 (예: 서울 중구 127)
    """
    # API 키가 없으면 오류 메시지 반환
    if not WEATHER_API_KEY:
        return "API 키가 설정되지 않았습니다. WEATHER_API_KEY 환경 변수를 설정해주세요."
    
    # 최신 발표 기준시간 구하기
    base_date, base_time = get_base_time()
    
    # API 요청 파라미터 설정
    params = {
        'serviceKey': WEATHER_API_KEY,  # URL 인코딩된 API 키 사용
        'numOfRows': '1000',  # 충분한 데이터를 가져오기 위해 큰 값 설정
        'pageNo': '1',
        'dataType': 'JSON',
        'base_date': base_date,
        'base_time': base_time,
        'nx': nx,
        'ny': ny
    }
    
    # API 요청
    data = make_api_request(FORECAST_URL, params)
    
    # 응답 확인 및 데이터 추출
    if not data or 'response' not in data:
        return "날씨 정보를 가져올 수 없습니다. API 응답이 유효하지 않습니다."
    
    # 응답 코드 확인
    response_code = data['response'].get('header', {}).get('resultCode')
    if response_code != '00':
        error_msg = data['response'].get('header', {}).get('resultMsg', '알 수 없는 오류')
        return f"API 오류: {error_msg} (코드: {response_code})"
    
    # 데이터 추출
    items = data['response'].get('body', {}).get('items', {}).get('item', [])
    
    if not items:
        return "날씨 예보 데이터가 없습니다."
    
    # 데이터 파싱 및 포맷팅
    forecasts = parse_weather_data(items)
    formatted_forecasts = format_forecast(forecasts)
    
    # 결과 반환
    if not formatted_forecasts:
        return "날씨 예보를 처리할 수 없습니다."
    
    return "\n---\n".join(formatted_forecasts)

@mcp.tool()
def get_current_weather(nx: int, ny: int) -> str:
    """기상청 좌표계(X,Y) 기준으로 현재 날씨를 조회합니다.

    Args:
        nx: 기상청 X좌표 (예: 서울 중구 60)
        ny: 기상청 Y좌표 (예: 서울 중구 127)
    """
    # API 키가 없으면 오류 메시지 반환
    if not WEATHER_API_KEY:
        return "API 키가 설정되지 않았습니다. WEATHER_API_KEY 환경 변수를 설정해주세요."
    
    # 최신 발표 기준시간 구하기
    base_date, base_time = get_base_time()
    
    # API 요청 파라미터 설정
    params = {
        'serviceKey': WEATHER_API_KEY,  # URL 인코딩된 API 키 사용
        'numOfRows': '1000',
        'pageNo': '1',
        'dataType': 'JSON',
        'base_date': base_date,
        'base_time': base_time,
        'nx': nx,
        'ny': ny
    }
    
    # API 요청
    data = make_api_request(FORECAST_URL, params)
    
    # 응답 확인 및 데이터 추출
    if not data or 'response' not in data:
        return "날씨 정보를 가져올 수 없습니다. API 응답이 유효하지 않습니다."
    
    # 응답 코드 확인
    response_code = data['response'].get('header', {}).get('resultCode')
    if response_code != '00':
        error_msg = data['response'].get('header', {}).get('resultMsg', '알 수 없는 오류')
        return f"API 오류: {error_msg} (코드: {response_code})"
    
    # 데이터 추출
    items = data['response'].get('body', {}).get('items', {}).get('item', [])
    
    if not items:
        return "날씨 데이터가 없습니다."
    
    # 데이터 파싱
    forecasts = parse_weather_data(items)
    
    # 가장 첫 번째 시간대 데이터를 현재 날씨로 사용
    if not forecasts:
        return "날씨 데이터를 처리할 수 없습니다."
        
    current_time_key = sorted(forecasts.keys())[0]
    current_data = forecasts[current_time_key]
    
    # 날씨 데이터 변환
    sky_condition = {
        '1': '맑음',
        '3': '구름많음',
        '4': '흐림'
    }.get(current_data.get('SKY', ''), '알 수 없음')
    
    precipitation_type = {
        '0': '없음',
        '1': '비',
        '2': '비/눈',
        '3': '눈',
        '4': '소나기'
    }.get(current_data.get('PTY', ''), '알 수 없음')
    
    # 데이터 메시지 구성
    current_weather = f"""현재 날씨 정보 (기준시간: {base_date} {base_time})
기온: {current_data.get('TMP', '알 수 없음')}°C
날씨: {sky_condition}
강수형태: {precipitation_type}
강수확률: {current_data.get('POP', '알 수 없음')}%
습도: {current_data.get('REH', '알 수 없음')}%
풍속: {current_data.get('WSD', '알 수 없음')}m/s
"""
    
    return current_weather

if __name__ == "__main__":
    # 시작 시 환경 변수 확인 및 정보 출력
    print(f"API 키 설정 여부: {'설정됨' if WEATHER_API_KEY else '설정되지 않음'}")
    # Initialize and run the server
    mcp.run(transport='stdio')
