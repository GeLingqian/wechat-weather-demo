const weatherMap={
  'sunny':'晴天',
  'cloudy':'多云',
  'overcast':'阴',
  'lightrain':'小雨',
  'heavyrain':'大雨',
  'snow':'雪'
}
const weatherColorMap = {
  'sunny': '#cbeefd',
  'cloudy': '#deeef6',
  'overcast': '#c6ced2',
  'lightrain': '#bdd5e1',
  'heavyrain': '#c5ccd0',
  'snow': '#aae1fc'
}
const QQMapWX = require('../../libs/qqmap-wx-jssdk.js');

const UNPROMPTED = 0
const UNAUTHORIZED = 1
const AUTHORIZED = 2
const UNPROMPTED_TIPS = "点击获取当前位置"
const UNAUTHORIZED_TIPS = "点击开启位置权限"
const AUTHORIZED_TIPS = ""

Page({
  data:{
    nowTemp:"14°",
    nowWeather:"多云",
    nowWeatherBackground:"",
    hourlyweather:[],
    city:"杭州市",
    LocationTipsText: UNPROMPTED_TIPS,
    LocationAuthType: UNPROMPTED
  },

  onPullDownRefresh() {
    this.getNow(() => {
      wx.stopPullDownRefresh()
    })
  },
  onLoad(){
    this.qqmapsdk = new QQMapWX({
      key: '7WRBZ-UJ33U-EFXVO-BXCHF-PQXWH-74BNY'
    })
    wx.getSetting({
      success:res=>{
        let auth = res.authSetting['scope.userLocation']
        let LocationAuthType = auth ? AUTHORIZED
          : (auth === false) ? UNAUTHORIZED : UNPROMPTED
        let LocationTipsText = auth ? AUTHORIZED_TIPS
          : (auth === false) ? UNAUTHORIZED_TIPS : UNPROMPTED_TIPS
        this.setData({
          LocationAuthType: LocationAuthType,
          LocationTipsText: LocationTipsText
        })
        if (auth)
          this.getLocation()
        else
          this.getNow()
      } 
    })
  },
  getNow(callback){
    wx.request({
      url: 'https://test-miniprogram.com/api/weather/now',
      data: {
        city: this.data.city
      },
      success: res => {
        console.log(res)
        let result = res.data.result;
        this.setNow(result);
        this.setHourlyWeather(result);
        this.setToday(result);
      },
      complete:() =>{
        callback && callback();
      }
    })
  },
  onTapDayWeather() {
    wx.navigateTo({
      url: '/pages/list/list?city=' + this.data.city,
    })
  },

  onTapLocation() {
    if (this.data.LocationAuthType === UNAUTHORIZED)
      wx.openSetting({
        success:res=>{
          let auth = res.authSetting["scope.userLocation"]
          if(auth){
            this.getLocation()
          }
        }
      })
    else
      this.getLocation()
  },
  getLocation() {
    wx.getLocation({
      success: res => {
        this.qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: res => {
            this.setData({
              LocationTipsText: AUTHORIZED_TIPS,
              LocationAuthType: AUTHORIZED
            })
            let city = res.result.address_component.city;
            this.setData({
              city: city
            })
            this.getNow();
          }
        })
      },
      fail: () => {
        this.setData({
          LocationTipsText: UNAUTHORIZED_TIPS,
          LocationAuthType: UNAUTHORIZED
        })
      }
    })
  },
  setNow(result){
    let temp = result.now.temp;
    let weather = result.now.weather;
    console.log(temp, weather);
    this.setData({
      nowTemp: temp + '°',
      nowWeather: weatherMap[weather],
      nowWeatherBackground: '/images/' + weather + '-bg.png'
    })
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: weatherColorMap[weather],
    })
  },
  setHourlyWeather(result){
    let forecast = result.forecast
    let hourlyweather = []
    let nowHour = new Date().getHours()
    for (let i = 0; i < 8; i += 1) {
      hourlyweather.push({
        time: (i * 3 + nowHour) % 24 + "时",
        iconPath: "/images/" + forecast[i].weather + "-icon.png",
        temp: forecast[i].temp + "°"
      })
    }
    hourlyweather[0].time = "现在";
    this.setData({
      hourlyweather: hourlyweather
    })
  },
  setToday(result){
    let date=new Date();
    this.setData({
      todayDate:`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} 今天`,
      todayTemp:`${result.today.minTemp}° - ${result.today.maxTemp}°`
    })
  }
})
