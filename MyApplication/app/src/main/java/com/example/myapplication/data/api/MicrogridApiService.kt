package com.example.myapplication.data.api

import com.example.myapplication.data.model.BatteryStatusResponse
import com.example.myapplication.data.model.DeviceStatusResponse
import com.example.myapplication.data.model.HealthCheckResponse
import com.example.myapplication.data.model.MicrogridResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface MicrogridApiService {
    
    @GET("/")
    suspend fun getMicrogridData(): Response<MicrogridResponse>
    
    @GET("batteries/status")
    suspend fun getBatteryStatus(): BatteryStatusResponse
    
    @GET("devices")
    suspend fun getDeviceStatus(): DeviceStatusResponse
    
    @GET("health")
    suspend fun getHealthCheck(): HealthCheckResponse
    
    @POST("step")
    suspend fun stepSimulation(@Query("timestep_hours") timestepHours: Double = 1.0): Response<MicrogridResponse>
    
    @POST("reset")
    suspend fun resetSimulation(): Response<MicrogridResponse>
    
    @POST("environment/temperature")
    suspend fun setTemperature(@Query("temperature") temperature: Double): Response<Map<String, Any>>
    
    @POST("environment/solar_radiation")
    suspend fun setSolarRadiation(@Query("solar_radiation") solarRadiation: Double): Response<Map<String, Any>>
    
    @POST("environment/wind_speed")
    suspend fun setWindSpeed(@Query("wind_speed") windSpeed: Double): Response<Map<String, Any>>
    
    @POST("environment/wind_direction")
    suspend fun setWindDirection(@Query("wind_direction") windDirection: Double): Response<Map<String, Any>>
}
