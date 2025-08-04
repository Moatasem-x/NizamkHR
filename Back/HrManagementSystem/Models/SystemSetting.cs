using System.ComponentModel.DataAnnotations;

namespace HrManagementSystem.Models
{
    public class SystemSetting
    {
        [Key]
        public int Id { get; set; }
        public string Weekend1 { get; set; }
        public string? Weekend2 { get; set; }
        public string HoursRate { get; set; }
        public int BonusValue { get; set; }
        public int DeductionValue { get; set; }    
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
