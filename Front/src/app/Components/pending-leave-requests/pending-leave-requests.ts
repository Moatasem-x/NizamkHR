import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-pending-leave-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-leave-requests.html',
  styleUrls: ['./pending-leave-requests.css']
})
export class PendingLeaveRequestsComponent implements OnInit {
  pendingLeaves = 5; // static value
  chart: any;
  ngOnInit() {
    setTimeout(() => this.renderChart(), 0);
  }
  renderChart() {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart('pendingLeaveRequestsChart', {
      type: 'doughnut',
      data: {
        labels: ['Pending Leaves'],
        datasets: [{
          data: [this.pendingLeaves],
          backgroundColor: ['#ab47bc'],
        }],
      },
      options: { cutout: '80%', plugins: { legend: { display: false } } },
    });
  }
} 