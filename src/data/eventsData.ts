export interface Event {
  id: number;
  title: string;
  date: string;
  imageUrl: string;
  description: string;
}

export const eventsData: Event[] = [
  {
    id: 1,
    title: "International Conference 2024",
    date: "March 15, 2024",
    imageUrl: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Keynote speaker at the International Tech Conference"
  },
  {
    id: 2,
    title: "Research Symposium",
    date: "April 22, 2024",
    imageUrl: "https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Panel discussion on emerging technologies"
  },
  {
    id: 3,
    title: "Workshop Series",
    date: "May 10, 2024",
    imageUrl: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Leading hands-on training sessions"
  },
  {
    id: 4,
    title: "Industry Summit",
    date: "June 8, 2024",
    imageUrl: "https://images.pexels.com/photos/2833037/pexels-photo-2833037.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Featured speaker on digital transformation"
  },
  {
    id: 5,
    title: "Academic Colloquium",
    date: "July 18, 2024",
    imageUrl: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Presenting latest research findings"
  }
];
