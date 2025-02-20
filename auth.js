// Ensure Supabase is loaded before using it
const { createClient } = window.supabase;

const SUPABASE_URL = "https://wvdggsrxtjdlfezenbbz.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZGdnc3J4dGpkbGZlemVuYmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNDc5NDcsImV4cCI6MjA1NTYyMzk0N30.4hJtANpuD5xx_J0Ukk6QoqTcnbV0gkjMeD2HcP5QxB8";

// Correctly initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function authenticateUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        let { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                console.log("User not found. Attempting sign-up...");

                const { data: signupData, error: signupError } =
                    await supabase.auth.signUp({ email, password });

                if (signupError) {
                    alert("Sign-up failed: " + signupError.message);
                    return;
                }

                const user = signupData.user;
                if (!user) {
                    alert("Error retrieving user data.");
                    return;
                }

                // Insert user into the users table on sign-up
                const { error: dbError } = await supabase.from("users").insert([
                    { id: user.id, email: email },
                ]);

                if (dbError) {
                    alert("Error saving user to database: " + dbError.message);
                    return;
                }

                alert("Sign-up successful! Redirecting...");
                window.location.href = "index.html";
            } else {
                alert("Login failed: " + error.message);
                return;
            }
        } else {
            // Check if user exists in the 'users' table
            const { data: userData, error: fetchError } = await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id) // Ensure matching the user's id
                .single(); // Use .single() to expect a single record

            // Handle error (no user found)
            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error("Error fetching user from users table:", fetchError);
                alert("An error occurred while fetching user data.");
                return;
            }

            // If no user data is found, insert the new user into the table
            if (!userData) {
                const { error: insertError } = await supabase.from("users").insert([
                    { id: data.user.id, email: data.user.email },
                ]);

                if (insertError) {
                    alert("Error inserting user into database: " + insertError.message);
                    return;
                }
            }

            alert("Login successful! Redirecting...");
            window.location.href = "index.html";
        }
    } catch (err) {
        console.error("Authentication error:", err);
        alert("An error occurred. Please try again.");
    }
}
