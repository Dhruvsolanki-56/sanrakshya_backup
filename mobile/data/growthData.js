// Sample WHO growth data for boys (0-24 months)
// In a real app, this would be more extensive and likely fetched from a server.

export const weightData = {
  labels: ['0', '3', '6', '9', '12', '15', '18', '21', '24'], // Months
  datasets: [
    {
      data: [3.3, 6.4, 7.9, 9.2, 10.2, 11.1, 11.8, 12.5, 13.1], // 50th percentile (median)
      color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`, // Primary color
      strokeWidth: 3,
    },
    {
      data: [2.5, 5.0, 6.4, 7.5, 8.4, 9.2, 9.9, 10.6, 11.2], // 15th percentile
      color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`, // Orange
      strokeWidth: 1,
    },
    {
      data: [4.2, 7.8, 9.4, 10.9, 12.0, 13.0, 13.7, 14.5, 15.1], // 85th percentile
      color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`, // Orange
      strokeWidth: 1,
    },
  ],
  legend: ['Median', '15th-85th Percentile'],
};

export const heightData = {
  labels: ['0', '3', '6', '9', '12', '15', '18', '21', '24'], // Months
  datasets: [
    {
      data: [49.9, 61.4, 67.6, 72.0, 75.7, 79.1, 82.3, 85.1, 87.8], // 50th percentile (median)
      color: (opacity = 1) => `rgba(16, 172, 132, ${opacity})`, // Green color
      strokeWidth: 3,
    },
    {
      data: [47.3, 58.4, 64.5, 68.7, 72.2, 75.4, 78.3, 81.0, 83.5], // 15th percentile
      color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`, // Orange
      strokeWidth: 1,
    },
    {
      data: [52.5, 64.4, 70.7, 75.3, 79.2, 82.8, 86.3, 89.2, 92.1], // 85th percentile
      color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`, // Orange
      strokeWidth: 1,
    },
  ],
  legend: ['Median', '15th-85th Percentile'],
};
