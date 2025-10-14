const tempf = 26.7;

export const widedata = {
  locations: [
    {
      station: "ts1",
      site_name: "test site #1",
      latitude: 45.56665,
      longitude: -123.12121,
      averaging: 3600
    }
  ],
  measurements: [
    {
      station: "ts1",
      datetime: "2024-01-01T00:00:00-08:00",
      particulate_matter_25: 10,
      tempf: 80
    },
    {
      station: "ts1",
      datetime: "2024-01-01T01:00:00-08:00",
      tempf: 80
    }
  ]
}

export const measurementErrors = {
    locations: widedata.locations,
    measurements: [
        ...widedata.measurements,
        {
            station: "ts1",
            datetime: "2024-01-01T01:00:00-08:00",
            tempf: null, // missing value
        },
        {
            station: "ts1",
            datetime: "2024-01-01T03:00:00-08:00",
            tempf: -99, // numeric error code
        },
        {
            station: "ts1",
            datetime: "2024-01-01T04:00:00-08:00",
            tempf: 'TOO_HIGH', // string error code
        },
        {
            station: "ts1",
            datetime: "2024-01-01T05:00:00-08:00",
            tempf: '22', // number as string
        },
    ]
}

export const csvdata = {
    locations: "station,site_name,latitude,longitude,averaging\n\"ts1\",\"test site #1\",45.56665, -123.12121, 3600",
    measurements: "station,datetime,particulate_matter_25,tempf\n\"ts1\",\"2024-01-01T00:00:00-08:00\",10,80\n\"ts1\",\"2024-01-01T01:00:00-08:00\",,80",
    all: "station,site_name,latitude,longitude,averaging,datetime,particulate_matter_25,tempf\n\"ts1\",\"test site #1\",45.56665,-123.12121,3600,\"2024-01-01T00:00:00-08:00\",10,80\n\"ts1\",\"test site #1\",45.56665,-123.12121,3600,\"2024-01-01T01:00:00-08:00\",,80"
}


export const expectedOutput = {
  meta: {
    schema: "v0.1",
    source: "testing",
    matching_method: "ingest-id"
  },
  locations: [
    {
      key: "testing-ts1",
      site_id: "ts1",
      site_name: "test site #1",
      coordinates: {
        latitude: 45.56665,
        longitude: -123.12121,
        proj: "EPSG:4326"
      },
      ismobile: false,
      systems: [
        {
          key: "testing-ts1",
          manufacturer_name: "default",
          model_name: "default",
          sensors: [
            {
              key: "testing-ts1-pm25:mass",
              status: "asdf",
              parameter: "pm25:mass",
              units: "ug/m3",
              averaging_interval_secs: 3600,
              logging_interval_secs: 3600,
              flags: []
            },
            {
              key: "testing-ts1-temperature",
              status: "asdf",
              parameter: "temperature",
              units: "c",
              averaging_interval_secs: 3600,
              logging_interval_secs: 3600,
              flags: []
            }
          ]
        }
      ]
    }
  ],
  measurements: [
    {
      key: "testing-ts1-pm25:mass",
      timestamp: "2024-01-01T00:00:00-08:00",
      value: 10
    },
    {
      key: "testing-ts1-temperature",
      timestamp: "2024-01-01T00:00:00-08:00",
      value: tempf
    },
    {
      key: "testing-ts1-temperature",
      timestamp: "2024-01-01T01:00:00-08:00",
      value: tempf
    }
  ]
};
