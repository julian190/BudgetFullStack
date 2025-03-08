import { date } from "zod";
import prisma from "./prisma"
import { getDate } from "date-fns";
function getFirstSundayAfter25th(year:number, month:number, dayNumber:number, dayName:number):Date {
    const previousMonth = month === 1 ? 12 : month - 1 === 0 ?12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const day25 = new Date(previousYear, previousMonth - 1, dayNumber);
  
    const daysUntilSunday = (dayName - day25.getDay() + 7) % 7;
    return new Date(day25.setDate(day25.getDate() + daysUntilSunday));
  }
  
  export async function CreateMonthAndPeriods(userid: string): Promise<void> {
    // Create month and periods
    const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const dayNumber = 25; // Assuming "25th" is fixed
      const dayName = 0; // Sunday corresponds to 0 in JavaScript
  
      const firstSunday = getFirstSundayAfter25th(currentYear, currentMonth, dayNumber, dayName);
      let current = firstSunday;
  
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  
      const periodLength:number = getFirstSundayAfter25th(nextYear, nextMonth, dayNumber, dayName).getTime() - firstSunday.getTime();
      const monthEnd = new Date(firstSunday.getTime() + periodLength);
  
      let weekNumber = 1;
      let monthId = "";
  
      // Retrieve or create the month record
      const month = await prisma.month.findFirst({
          where: { userId: userid, year: currentYear, monthNumber: currentMonth },
      });
  
      if (!month) {
          const savedMonth = await prisma.month.create({
              data: { monthNumber: currentMonth, year: currentYear, userId: userid },
          });
  
          monthId = savedMonth.id;
  
          const uniqueExpenses = await prisma.expenseCategory.findMany({
              where: { userId: userid },
              distinct: ['name'],
              select: { name: true, budget: true , userId: true, monthId: true},
          });
  
          for (const expense of uniqueExpenses) {
              await prisma.expenseCategory.create({
               
                  data: {
                      name: expense.name,
                      budget: expense.budget,
                      userId: userid,
                      monthId: monthId,
                  },
              });
          }
      } else {
          monthId = month.id;
      }
      
      // Save weeks to the database
      while (current <= monthEnd) {
          const weekStart = new Date(current);
          const weekEnd = new Date(Math.min(current.getTime() + 6 * 24 * 60 * 60 * 1000, monthEnd.getTime()));
  
          if (weekStart.getTime() === weekEnd.getTime()) {
              break;
          }
  
          const exists = await prisma.period.findFirst({
              where: { startDate: weekStart, endDate: weekEnd, userId: userid },
          });
  
          if (!exists) {
              const newPeriod = await prisma.period.create({
                  data: {
                      userId: userid,
                      monthId: monthId,
                      startDate: weekStart,
                      endDate: weekEnd,
                      weekName: `Week ${weekNumber}`,
                  },
              });
  
              console.log(`Saved period with ID: ${newPeriod.id}`);
          }
  
          current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
          weekNumber++;
  
          if (current > monthEnd) {
              break;
          } 
      }
      // Set all months to inactive first
      await prisma.month.updateMany({
          where: { userId: userid },
          data: { active: false }
      });

      // Set the current month to active
      await prisma.month.update({
          where: { id: monthId },
          data: { active: true }
      });
     
  }