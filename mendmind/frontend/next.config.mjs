const nextConfig = {
	async redirects() {
		return [
			{ source: "/", destination: "/index.html", permanent: false },
			{ source: "/login.html", destination: "/login_fixed.html", permanent: false },
			{ source: "/signup", destination: "/signup.html", permanent: false },
			{ source: "/role-selection", destination: "/role-selection.html", permanent: false },
			{ source: "/email-verification", destination: "/email-verification.html", permanent: false },
			{ source: "/student", destination: "/student-dashboard.html", permanent: false },
			{ source: "/student/practice", destination: "/ai-tutor.html", permanent: false },
						{ source: "/student/progress", destination: "/student-tools.html?view=progress", permanent: false },
						{ source: "/student/learnings", destination: "/student-tools.html?view=learning", permanent: false },
						{ source: "/student/settings", destination: "/student-tools.html?view=settings", permanent: false },
						{ source: "/student/quizzes", destination: "/student-tools.html?view=quizzes", permanent: false },
						{ source: "/student/notes", destination: "/student-tools.html?view=notes", permanent: false },
						{ source: "/student/projects", destination: "/student-tools.html?view=projects", permanent: false },
						{ source: "/student/calendar", destination: "/student-tools.html?view=calendar", permanent: false },
			{ source: "/teacher/dashboard", destination: "/teacher-dashboard.html", permanent: false },
			{ source: "/teacher/home", destination: "/teacher-dashboard.html", permanent: false },
			{ source: "/student-dashboard", destination: "/student-dashboard.html", permanent: false },
			{ source: "/teacher-dashboard", destination: "/teacher-dashboard.html", permanent: false },
			{ source: "/ai-tutor", destination: "/ai-tutor.html", permanent: false },
		];
	},
};

export default nextConfig;
