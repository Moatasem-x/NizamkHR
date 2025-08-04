import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-absentees-today',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './absentees-today.html',
  styleUrls: ['./absentees-today.css']
})
export class AbsenteesTodayComponent implements OnInit {
  absenteesToday = 22; // static value
  chart: any;
  ngOnInit() {
    setTimeout(() => this.renderChart(), 0);
  }
  renderChart() {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart('absenteesTodayChart', {
      type: 'doughnut',
      data: {
        labels: ['Absentees Today'],
        datasets: [{
          data: [this.absenteesToday],
          backgroundColor: ['#ef5350'],
        }],
      },
      options: { cutout: '80%', plugins: { legend: { display: false } } },
    });
  }
} 