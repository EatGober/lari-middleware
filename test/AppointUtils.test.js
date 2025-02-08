// __tests__/AppointUtils.test.js


const {
  filterAppointmentsByDuration,
  filterAppointmentsByStartTime,
  filterAppointmentsByEndTime
} = require('../src/AppointUtils');

describe('AppointUtils', () => {
  // Mock appointment data
  const mockAppointments = [
    {
      appointmentid: "1",
      duration: 30,
      scheduledDateTimeString: "12/25/2024 09:00:00"
    },
    {
      appointmentid: "2",
      duration: 60,
      scheduledDateTimeString: "12/25/2024 10:00:00"
    },
    {
      appointmentid: "3",
      duration: 15,
      scheduledDateTimeString: "12/25/2024 11:00:00"
    }
  ];

  describe('filterAppointmentsByDuration', () => {
    it('should filter appointments by maximum duration', () => {
      const result = filterAppointmentsByDuration(mockAppointments, 45);
      expect(result).toHaveLength(2);
      expect(result[0].appointmentid).toBe("1");
      expect(result[1].appointmentid).toBe("3");
    });

    it('should handle empty array', () => {
      const result = filterAppointmentsByDuration([], 45);
      expect(result).toHaveLength(0);
    });

    it('should throw error for non-array input', () => {
      expect(() => filterAppointmentsByDuration(null, 45)).toThrow(TypeError);
      expect(() => filterAppointmentsByDuration(undefined, 45)).toThrow(TypeError);
    });
  });

  describe('filterAppointmentsByStartTime', () => {
    it('should filter appointments after start time', () => {
      const startTime = new Date(2024, 11, 25, 10, 0, 0); // Dec 25, 2024 10:00:00
      const result = filterAppointmentsByStartTime(mockAppointments, startTime);
      expect(result).toHaveLength(2);
      expect(result[0].appointmentid).toBe("2");
      expect(result[1].appointmentid).toBe("3");
    });

    it('should throw error for invalid start time', () => {
      expect(() => filterAppointmentsByStartTime(mockAppointments, "invalid")).toThrow();
    });
  });

  describe('filterAppointmentsByEndTime', () => {
    it('should filter appointments before end time', () => {
      const endTime = new Date(2024, 11, 25, 10, 30, 0); // Dec 25, 2024 10:30:00
      const result = filterAppointmentsByEndTime(mockAppointments, endTime);
      expect(result).toHaveLength(2);
      expect(result[0].appointmentid).toBe("1");
      expect(result[1].appointmentid).toBe("2");
    });

    it('should throw error for invalid end time', () => {
      expect(() => filterAppointmentsByEndTime(mockAppointments, "invalid")).toThrow();
    });
  });
});
