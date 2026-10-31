import { useMemo } from 'react';

export default (t) =>
  useMemo(
    () => ({
      custom: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      positionPeriodic: [
        {
          key: 'frequency',
          name: t('commandFrequency'),
          type: 'number',
        },
      ],
      setTimezone: [
        {
          key: 'timezone',
          name: t('commandTimezone'),
          type: 'string',
        },
      ],
      sendSms: [
        {
          key: 'phone',
          name: t('commandPhone'),
          type: 'string',
        },
        {
          key: 'message',
          name: t('commandMessage'),
          type: 'string',
        },
      ],
      message: [
        {
          key: 'message',
          name: t('commandMessage'),
          type: 'string',
        },
      ],
      sendUssd: [
        {
          key: 'phone',
          name: t('commandPhone'),
          type: 'string',
        },
      ],
      sosNumber: [
        {
          key: 'index',
          name: t('commandIndex'),
          type: 'number',
        },
        {
          key: 'phone',
          name: t('commandPhone'),
          type: 'string',
        },
      ],
      silenceTime: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      setPhonebook: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      voiceMessage: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      outputControl: [
        {
          key: 'index',
          name: t('commandIndex'),
          type: 'number',
        },
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      voiceMonitoring: [
        {
          key: 'enable',
          name: t('commandEnable'),
          type: 'boolean',
        },
      ],
      setAgps: [
        {
          key: 'enable',
          name: t('commandEnable'),
          type: 'boolean',
        },
      ],
      setIndicator: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      configuration: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      setConnection: [
        {
          key: 'server',
          name: t('commandServer'),
          type: 'string',
        },
        {
          key: 'port',
          name: t('commandPort'),
          type: 'number',
        },
      ],
      setOdometer: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      setHbt: [
        {
          key: 'time',
          name: t('reportDuration'),
          description: t('commandHbtTime'),
          type: 'number',
          min: 0,
          max: 65000,
          default: 0,
          unit: 'min',
          placeholder: '0',
        },
        {
          key: 'value',
          name: t('positionHeartRate'),
          description: t('commandHbtInterval'),
          type: 'number',
          min: 0,
          max: 65000,
          default: 5,
          unit: 'min',
          placeholder: '5',
        },
      ],
      modePowerSaving: [
        {
          key: 'enable',
          name: t('commandEnable'),
          type: 'boolean',
        },
      ],
      modeDeepSleep: [
        {
          key: 'mode',
          name: t('commandDeepSleep'),
          description: t('commandModeDeepSleepDescription'),
          type: 'number',
          min: 0,
          max: 2,
          default: 1,
          placeholder: '1',
        },
      ],
      alarmGeofence: [
        {
          key: 'radius',
          name: t('commandRadius'),
          type: 'number',
        },
      ],
      alarmBattery: [
        {
          key: 'enable',
          name: t('commandEnable'),
          type: 'boolean',
        },
      ],
      alarmSos: [
        {
          key: 'enable',
          name: t('commandEnable'),
          type: 'boolean',
        },
      ],
      alarmRemove: [
        {
          key: 'enable',
          name: t('commandEnable'),
          type: 'boolean',
        },
      ],
      alarmClock: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      alarmSpeed: [
        {
          key: 'data',
          name: t('commandData'),
          type: 'string',
        },
      ],
      alarmFall: [
        {
          key: 'enable',
          name: t('commandEnable'),
          type: 'boolean',
        },
      ],
      alarmVibrationlevel: [
        {
          key: 'alarmSensorlevel',
          name: t('commandAlarmSensorlevel'),
          type: 'string',
        },
      ],
      alarmAcceleration: [
        {
          key: 'acceleration',
          name: t('commandAcceleration'),
          description: t('commandAccelerationDescription'),
          type: 'number',
          min: 0,
          max: 5000,
          default: 450,
          unit: 'mg',
          placeholder: '450',
        },
      ],

      alarmDeceleration: [
        {
          key: 'deceleration',
          name: t('commandDeceleration'),
          description: t('commandDecelerationDescription'),
          type: 'number',
          min: 0,
          max: 5000,
          default: 800,
          unit: 'mg',
          placeholder: '800',
        },
      ],

      alarmHarshTurning: [
        {
          key: 'value',
          name: t('commandHarshTurning'),
          description: t('commandHarshTurningDescription'),
          type: 'number',
          min: 0,
          max: 32,
          default: 9,
          placeholder: '9',
        },
      ],

      alarmImpact: [
        {
          key: 'value',
          name: t('commandImpact'),
          description: t('commandImpactDescription'),
          type: 'number',
          min: 0,
          max: 10,
          default: 5,
          placeholder: '5',
        },
      ],

      alarmVibration: [
        {
          key: 'time',
          name: t('commandTowTime'),
          description: t('commandTowTimeDescription'),
          type: 'number',
          min: 0,
          max: 255,
          default: 10,
          unit: 'sec',
          placeholder: '10',
        },
        {
          key: 'mode',
          name: t('commandTowMode'),
          description: t('commandTowModeDescription'),
          type: 'number',
          min: 0,
          max: 1,
          default: 0,
          placeholder: '0',
        },
      ],

      alarmIdling: [
        {
          key: 'time',
          name: t('commandIdlingTime'),
          description: t('commandIdlingTimeDescription'),
          type: 'number',
          min: 0,
          max: 255,
          default: 5,
          unit: 'min',
          placeholder: '5',
        },
      ],

      alarmFatigueDriving: [
        {
          key: 'fatigueTime',
          name: t('commandFatigueTime'),
          description: t('commandFatigueTimeDescription'),
          type: 'number',
          min: 0,
          max: 255,
          default: 240,
          unit: 'min',
          placeholder: '240',
        },
        {
          key: 'restTime',
          name: t('commandRestTime'),
          description: t('commandRestTimeDescription'),
          type: 'number',
          min: 0,
          max: 255,
          default: 20,
          unit: 'min',
          placeholder: '20',
        },
        {
          key: 'totalDriveTime',
          name: t('commandTotalDriveTime'),
          description: t('commandTotalDriveTimeDescription'),
          type: 'number',
          min: 0,
          max: 1440,
          default: 480,
          unit: 'min',
          placeholder: '480',
        },
      ],

      alarmVibrationSensitivity: [
        {
          key: 'sensitivity',
          name: t('commandSensitivity'),
          description: t('commandAlarmVibrationSensitivityDescription'),
          type: 'number',
          min: 3,
          max: 255,
          default: 3,
          placeholder: '3',
        },
      ],

      alarmGsmJamming: [
        {
          key: 'time',
          name: t('commandGsmJammingTime'),
          description: t('commandGsmJammingTimeDescription'),
          type: 'number',
          min: 0,
          max: 255,
          default: 10,
          unit: 'sec',
          placeholder: '10',
        },
      ],

      accOffNoPosition: [
        {
          key: 'enable',
          name: t('commandAccOffNoPosition'),
          description: t('commandAccOffNoPositionDescription'),
          type: 'boolean',
        },
      ],

      smsInterval: [
        {
          key: 'normalTime',
          name: t('commandNormalTime'),
          description: t('commandNormalTimeDescription'),
          type: 'number',
          min: 0,
          max: 65535,
          default: 5,
          unit: 'min',
          placeholder: '5',
        },
        {
          key: 'accOffTime',
          name: t('commandAccOffTime'),
          description: t('commandAccOffTimeDescription'),
          type: 'number',
          min: 0,
          max: 65535,
          default: 30,
          unit: 'min',
          placeholder: '30',
        },
        {
          key: 'stoppingTime',
          name: t('commandStoppingTime'),
          description: t('commandStoppingTimeDescription'),
          type: 'number',
          min: 0,
          max: 65535,
          default: 60,
          unit: 'min',
          placeholder: '60',
        },
      ],
    }),

    [t],

  );
