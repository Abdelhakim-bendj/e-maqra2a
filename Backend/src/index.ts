import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n======================================`);
    console.log(`🧪 TEST CREDENTIALS (Development Only)`);
    console.log(`======================================`);
    console.log(`Admin:   bendjelloulabedelhakim@gmail.com`);
    console.log(`Teacher: teacher1@emaqra2a.com (has students 1-10)`);
    console.log(`Student: student1@emaqra2a.com`);
    console.log(`Password for all: Password123!`);
    console.log(`======================================\n`);
  }
});


