import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-attendance-today',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-today.html',
  styleUrls: ['./attendance-today.css']
})
export class AttendanceTodayComponent implements OnInit {
  totalAttendanceToday = 98; // static value
  chart: any;
  ngOnInit() {
    setTimeout(() => this.renderChart(), 0);
  }
  renderChart() {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart('attendanceTodayChart', {
      type: 'doughnut',
      data: {
        labels: ['Attendance Today'],
        datasets: [{
          data: [this.totalAttendanceToday],
          backgroundColor: ['#ffa726'],
        }],
      },
      options: { cutout: '80%', plugins: { legend: { display: false } } },
    });
  }
} 