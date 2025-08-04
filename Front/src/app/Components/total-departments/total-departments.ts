import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-total-departments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './total-departments.html',
  styleUrls: ['./total-departments.css']
})
export class TotalDepartmentsComponent implements OnInit {
  totalDepartments = 8; // static value
  chart: any;
  ngOnInit() {
    setTimeout(() => this.renderChart(), 0);
  }
  renderChart() {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart('totalDepartmentsChart', {
      type: 'doughnut',
      data: {
        labels: ['Departments'],
        datasets: [{
          data: [this.totalDepartments],
          backgroundColor: ['#66bb6a'],
        }],
      },
      options: { cutout: '80%', plugins: { legend: { display: false } } },
    });
  }
} 