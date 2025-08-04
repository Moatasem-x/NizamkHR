import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-total-employees',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './total-employees.html',
  styleUrls: ['./total-employees.css']
})
export class TotalEmployeesComponent implements OnInit {
  totalEmployees = 120; // static value
  chart: any;
  ngOnInit() {
    setTimeout(() => this.renderChart(), 0);
  }
  renderChart() {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart('totalEmployeesChart', {
      type: 'doughnut',
      data: {
        labels: ['Employees'],
        datasets: [{
          data: [this.totalEmployees],
          backgroundColor: ['#42a5f5'],
        }],
      },
      options: { cutout: '80%', plugins: { legend: { display: false } } },
    });
  }
} 